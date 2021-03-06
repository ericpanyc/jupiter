(function () {
    // dom elements
    var oAvatar = document.getElementById('avatar'),
        oWelcomeMsg = document.getElementById('welcome-msg'),
        oLogoutBtn = document.getElementById('logout-link'),
        oRegisterFormBtn = document.getElementById('register-form-btn'),
        oLoginBtn = document.getElementById('login-btn'),
        oLoginForm = document.getElementById('login-form'),
        oLoginUsername = document.getElementById('username'),
        oLoginPwd = document.getElementById('password'),
        oLoginFormBtn = document.getElementById('login-form-btn'),
        oLoginErrorField = document.getElementById('login-error'),

        oRegisterBtn = document.getElementById('register-btn'),
        oRegisterUsername = document.getElementById('register-username'),
        oRegisterPwd = document.getElementById('register-password'),
        oRegisterFirstName = document.getElementById('register-first-name'),
        oRegisterLastName = document.getElementById('register-last-name'),
        oRegisterForm = document.getElementById('register-form'),
        oRegisterResultField = document.getElementById('register-result'),

        oNearbyBtn = document.getElementById('nearby-btn'),
        oFavBtn = document.getElementById('fav-btn'),
        oRecommendBtn = document.getElementById('recommend-btn'),
        oNavBtnBox = document.getElementsByClassName('main-nav')[0],
        oNavBtnList = document.getElementsByClassName('main-nav-btn'),
        oItemNav = document.getElementById('item-nav'),
        oItemList = document.getElementById('item-list'),

        // will introduce the following part later
        oTpl = document.getElementById('tpl').innerHTML,


        // default user info
        // userId = '1111',
        // userFullName = 'John',
        itemArr,
        lng = -122,
        lat = 47;



    function init(){
        validateSession();
        bindEvent();
    }

    function validateSession(){
        switchLoginRegister('login');
    }

    function switchLoginRegister(name) {
        // hide header
        showOrHideElement(oAvatar, 'none');
        showOrHideElement(oWelcomeMsg, 'none');
        showOrHideElement(oLogoutBtn, 'none');

        //hide item list
        showOrHideElement(oItemNav, 'none');
        showOrHideElement(oItemList, 'none');

        //hide
        if(name === "login") {
            // hide register form
            showOrHideElement(oRegisterForm, 'none');
            // clear register error
            oRegisterResultField.innerHTML = '';
            // show login form
            showOrHideElement(oLoginForm, 'block');
        } else {
            // hide login form
            showOrHideElement(oLoginForm, 'none');
            // clear login error if existed
            oLoginErrorField.innerHTML = '';

            // show register form
            showOrHideElement(oRegisterForm, 'block');

        }


    }

    function showOrHideElement(ele, style){
        // display attribute in css
        ele.style.display = style;
    }

    function bindEvent(){
        oRegisterFormBtn.addEventListener('click', function() {
            switchLoginRegister('register');
        }, false);

        oLoginFormBtn.addEventListener('click', function(){
            switchLoginRegister('login');
        }, false);
        // login api
        oLoginBtn.addEventListener('click', loginExecutor, false);
        oItemList.addEventListener('click', changeFavoriteItem, false);
        oRegisterBtn.addEventListener('click', registerExecutor, false);
        oNearbyBtn.addEventListener('click', loadNearbyData, false);
        oFavBtn.addEventListener('click', loadFavoriteItems, false);
        oRecommendBtn.addEventListener('click', loadRecommendedItems, false);
    }


    function loginExecutor() {
        var userName = oLoginUsername.value,
            passWord = oLoginPwd.value;
        if(userName === '' || passWord ==='') {
            oLoginErrorField.innerHTML = 'Please fill in all fields';
            return;
        }
        passWord = md5(userName + md5(passWord));
        ajax({
            method: 'POST',
            url: './login',
            data: {
                user_id: userName,
                password: passWord
            },
            success: function(res) {
                if(res.status === "OK") {
                    welcomeMsg(res);
                    fetchData();
                }
            },
            error: function() {
                throw new Error('Invalid username or password');
            }
        })

    }


    function fetchData() {
        initGeo(loadNearbyData);
    }

    function loadNearbyData() {
        activeBtn('nearby-btn');
        // fetch nearby data
        var opt = {
            method: 'GET',
            url: './search?user_id=' + userId + '&lat=' + lat + '&lon=' + lng,
            data: null,
            message: 'nearby'
        }
        serverExecutor(opt);
    }

    function render(data) {
        var len = data.length,
            list = '',
            item;

        for(var i = 0; i < len; i++) {
            item = data[i];
            list += oTpl.replace(/{{(.*?)}}/g,function (node, key) {
                if(key === 'location') {
                    return item[key].replace(/,/g, '<br ,>').replace(/\"/,'');
                }
                if(key === 'company_logo') {
                    return item[key] || 'https://via.placeholder.com/100';
                }
                if(key === 'favorite') {
                    return item[key] ? "fa fa-heart" : "fa fa-heart-o";
                }
                return item[key];
            })
        }
        oItemList.innerHTML = list;
    }

    function activeBtn(btnId) {
        var len = oNavBtnList.length;
        for (var i = 0; i < len; i++) {
            oNavBtnList[i].className = 'main-nav-btn';
        }
        var btn = document.getElementById(btnId);
        btn.className += ' active';
    }

    function initGeo(cb) {
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    // lat = position.coords.latitude || lat;
                    // lng = position.coords.longitude || lng;
                    cb();
                },
                function() {
                    throw new Error('Geo fail');
                }, {
                    maximumAge:60000
                });
            oItemList.innerHTML = '<p class="notice"><i class="fa fa-spinner fa-spin"></i>Retrieving your location...</p>';
        } else {
            throw new Error('Your browser does not support navigator!!');
        }

    }


    function welcomeMsg(msg) {
        // show header
        userId = msg.user_id;
        userFullName = msg.name;
        oWelcomeMsg.innerHTML = 'Welcome' + userFullName;
        showOrHideElement(oAvatar, 'block');
        showOrHideElement(oLogoutBtn, 'block');
        showOrHideElement(oItemNav, 'block');
        showOrHideElement(oItemList, 'block');
        showOrHideElement(oLogoutBtn, 'block');
        // hide login
        showOrHideElement(oLoginForm, 'none');
    }

    function changeFavoriteItem(evt) {
        var tar = evt.target,
            oParent = tar.parentElement;

        if (oParent && oParent.className === 'fav-link') {
            var oCurLi = oParent.parentElement,
                classname = tar.className,
                isFavorite = classname === 'fa fa-heart' ? true : false,
                oItems = oItemList.getElementsByClassName('item'),
                index = Array.prototype.indexOf.call(oItems, oCurLi),
                url = './history',
                req = {
                    user_id: userId,
                    favorite: itemArr[index]
                };
            var method = !isFavorite ? 'POST' : 'DELETE';

            ajax({
                method: method,
                url: url,
                data: req,
                success: function (res) {
                    if (res.status === 'OK' || res.result === 'SUCCESS') {
                        tar.className = !isFavorite ? 'fa fa-heart' : 'fa fa-heart-o';
                    } else {
                        throw new Error('Change Favorite failed!')
                    }
                },
                error: function () {
                    throw new Error('Change Favorite failed!')
                }
            })
        }
    }

    // AJAX helper
    function ajax(opt) {
        var opt = opt || {},
            method = (opt.method || 'GET').toUpperCase(),
            url = opt.url,
            data = opt.data || null,
            success = opt.success || function() {},
            error = opt.error || function() {},
            // create
            xhr = new XMLHttpRequest();

        if(!url) {
            throw new Error('missing url');
        }
        // config
        xhr.open(method, url, true);

        // send
        if(!data) {
            xhr.send();
        } else {
            xhr.setRequestHeader('Content-type','application/json;charset=utf-8');
            xhr.send(JSON.stringify(data));
        }

        // listen
        // success
        xhr.onload = function() {
            // check response
            if(xhr.status === 200) {
                success(JSON.parse(xhr.responseText));
            }
        }
        // fail
        xhr.onerror = function() {
            error();
        }


    }

    function serverExecutor(opt) {
        oItemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-triangle"></i>Loading ' + opt.message + ' item...</p>';
        ajax({
            method: opt.method,
            url: opt.url,
            data: opt.data,
            success: function (res) {
                if (!res || res.length === 0) {
                    oItemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-triangle"></i>No ' + opt.message + ' item!</p>';
                } else {
                    render(res);
                    itemArr = res;
                }
            },
            error: function () {
                throw new Error('No ' + opt.message + ' items!');
            }
        })
    }

    function registerExecutor() {
        var username = oRegisterUsername.value,
            password = oRegisterPwd.value,
            firstName = oRegisterFirstName.value,
            lastName = oRegisterLastName.value;

        if (username === '' || password === '' || firstName === '' || lastName === '') {
            oRegisterResultField.innerHTML = 'Please fill in  all fields';
        }

        if (username.match(/^[a-z0-9_]+$/) === null) {
            oRegisterResultField.innerHTML = 'Invalid username';
        }

        ajax({
            method: 'POST',
            url: './register',
            data: {
              user_id: username,
              password: password,
              first_name: firstName,
              last_name: lastName
            },
            success: function(res) {
                if (res.status === 'OK' || res.result === 'OK') {
                    oRegisterResultField.innerHTML = 'Successfully registered';
                } else {
                    oRegisterResultField.innerHTML = 'User already existed';
                }
            },
            error: function() {
                // show login error
                throw new Error('Failed to register');
            }
        })
    }

    function loadFavoriteItems() {
        activeBtn('fav-btn');
        var opt = {
            method: 'GET',
            url: './history?user_id=' + userId,
            data: null,
            message: 'favorite'
        }
        serverExecutor(opt);
    }

    function loadRecommendedItems() {
        activeBtn('recommend-btn');
        var opt = {
            method: 'GET',
            url: './recommendation?user_id=' + userId + '&lat=' + '&lon=' + lng,
            data: null,
            message: 'recommended'
        }
        serverExecutor(opt);
    }



    // entry fn - init fn
    init();
})()

// fetch data
// render data
// nearby favorite recommendation

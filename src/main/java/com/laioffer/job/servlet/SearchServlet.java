package com.laioffer.job.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laioffer.job.db.MySQLConnection;
import com.laioffer.job.entity.Item;
import com.laioffer.job.entity.ResultResponse;
import com.laioffer.job.external.GitHubClient;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@WebServlet(name = "SearchServlet", urlPatterns = {"/search"})
public class SearchServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        ObjectMapper mapper = new ObjectMapper();
        HttpSession session = request.getSession(false);
        if (session == null) {
            response.setStatus(403);
            mapper.writeValue(response.getWriter(), new ResultResponse("Session Invalid"));
            return;
        }


        String userId = request.getParameter("user_id");
        double lat = Double.parseDouble(request.getParameter("lat"));
        double lon = Double.parseDouble(request.getParameter("lon"));

        MySQLConnection connection = new MySQLConnection();
        Set<String> favoriteItemIds = connection.getFavoriteItemIds(userId);
        connection.close();

        GitHubClient client = new GitHubClient();
        response.setContentType("application/json");
        List<Item> items = client.search(lat, lon, null);

        for (Item item : items) {
            item.setFavorite(favoriteItemIds.contains(item.getId()));
        }

//        String id, String title, String location, String companyLogo, String url, String description, Set<String> keywords, boolean favorite
        List<Item> arrayListItem = new ArrayList<Item>(items);
        Item item1 = arrayListItem.get(0);
        Item item2 = new Item(
                item1.getId(),
                item1.getTitle(),
                item1.getLocation(),
                item1.getCompanyLogo(),
                item1.getUrl(),
                item1.getDescription(),
                item1.getKeywords(),
                item1.getFavorite()
        );
        arrayListItem.add(item2);

        mapper.writeValue(response.getWriter(), arrayListItem);
    }
}

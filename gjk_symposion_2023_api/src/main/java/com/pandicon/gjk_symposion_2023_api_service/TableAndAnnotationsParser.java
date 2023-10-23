package com.pandicon.gjk_symposion_2023_api_service;

import com.pandicon.gjk_symposion_2023_api.api_model.Table;
import org.javatuples.Pair;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.Optional;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URL;
import java.net.URLConnection;
import java.util.stream.Collectors;

public class TableAndAnnotationsParser {
    private final String data_url;

    public TableAndAnnotationsParser(final String i_data_url) {
        this.data_url = i_data_url;
    }
    
    private Optional<String> load_data() {
        try {
            final URLConnection connection = new URL(this.data_url).openConnection();
            connection.setConnectTimeout(15*1000); // Set timeout to 15 seconds
            connection.setReadTimeout(60*1000); // Set read timeout to 60 seconds

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
                final String contents = reader.lines().collect(Collectors.joining("\n"));
                System.out.println(contents);
                return Optional.of(contents);
            } catch (IOException e) {
                System.err.println("Failed to get connection input stream: " + e);
                return Optional.empty();
            }
        } catch (MalformedURLException e) {
            System.err.println("Failed to create URL: " + e);
            return Optional.empty();
        } catch (IOException e) {
            System.err.println("Failed to create connection: " + e);
            return Optional.empty();
        }
    }

    public Optional<Pair<String, Table>> get_data() {
        final Optional<String> csv_data_opt = this.load_data();
        if(csv_data_opt.isEmpty()) {
            System.out.println("Failed to get the sheet.");
            return Optional.empty();
        }
        final String csv_data = csv_data_opt.get();

        return Optional.empty();
    }
}

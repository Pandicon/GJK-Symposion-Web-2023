package com.pandicon.gjk_symposion_2023_api_service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pandicon.gjk_symposion_2023_api.api_model.Table;
import com.pandicon.gjk_symposion_2023_api.api_model.TableResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

class Settings {
    public long cache_refresh_cooldown_ms;
    public String sheet_url;
}

@Service
public class APIService {
    private long last_harmonogram_cache_update;
    private List<Table> harmonogram_cache;
    final private String sheet_url;
    final private long cache_refresh_cooldown_ms;
    public APIService() {
        last_harmonogram_cache_update = 0;
        harmonogram_cache = new ArrayList<Table>();

        ObjectMapper mapper = new ObjectMapper();
        try {
            BufferedReader reader = new BufferedReader(new FileReader("./settings.json"));
            StringBuilder settings_file = new StringBuilder();
            String line = reader.readLine();
            while (line != null) {
                settings_file.append(line);
                line = reader.readLine();
            }
            reader.close();
            try {
                Settings settings = mapper.readValue(settings_file.toString(), Settings.class);
                this.sheet_url = settings.sheet_url;
                this.cache_refresh_cooldown_ms = settings.cache_refresh_cooldown_ms;
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to parse the settings JSON file: \n" + e);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read the settings JSON file: \n" + e);
        }
    }

    public void fetch_harmonogram() {
        System.out.println("Fetching harmonogram :D");
        this.last_harmonogram_cache_update = new Date().getTime();
    }
    public ResponseEntity<String> get_test(Optional<Integer> id_opt, Optional<List<Integer>> ids_opt) {
        StringBuilder response = new StringBuilder();
        if(id_opt.isPresent()) {
            int id = id_opt.get();
            response.append("Here is the number from the parameter: ").append(id).append("<br>").append("Here is the number from the parameter, but squared: ").append(id * id).append("<br>");
        }
        if(ids_opt.isPresent()) {
            List<Integer> ids = ids_opt.get();
            response.append("Here are the numbers from the parameter, all cubed: ");
            for(Integer id : ids) {
                response.append(id * id * id).append(" ");
            }
            if(!ids.isEmpty()) {
                response.append("<br>");
            }
        }
        response.append(":D");

        return new ResponseEntity<>(response.toString(), HttpStatus.OK);
    }

    public ResponseEntity<Map<String, Object>> get_harmonogram(Optional<List<Integer>> days) {
        if(this.harmonogram_cache.isEmpty() || this.last_harmonogram_cache_update + this.cache_refresh_cooldown_ms < new Date().getTime()) {
            this.fetch_harmonogram();
        }
        if(this.harmonogram_cache.isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("timestamp", LocalDateTime.now());
            errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            errorResponse.put("error", "Internal Server Error");
            errorResponse.put("message", "Failed to get harmonogram data");

            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        List<Table> harmonogram_days = new ArrayList<Table>();
        if(days.isPresent()) {
            for(int day : days.get()) {
                if(day >= this.harmonogram_cache.size()) {
                    continue;
                }
                harmonogram_days.add(this.harmonogram_cache.get(day));
            }
        } else {
            harmonogram_days = this.harmonogram_cache;
        }
        Map<String, Object> response = new HashMap<>();
        response.put("data", new TableResponse(this.last_harmonogram_cache_update, harmonogram_days));
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}

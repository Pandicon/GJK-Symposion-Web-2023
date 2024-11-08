package com.pandicon.gjk_symposion_2023_api_service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pandicon.gjk_symposion_2023_api.api_model.*;
import org.javatuples.Triplet;
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
    public String cell_content_to_be_considered_empty;
    public String sheet_url;
}

@Service
public class APIService {
    private long last_harmonogram_cache_update;
    private boolean is_harmonogram_public;
    private String public_harmonogram_note;
    private String private_harmonogram_note;

    private List<Table> harmonogram_cache;
    private List<HashMap<String, AdditionalData>> annotations_per_day_cache;
    private HashMap<String, AdditionalData> annotations_cache;
    final private String sheet_url;
    final private String cell_content_to_be_considered_empty;
    final private long cache_refresh_cooldown_ms;
    public APIService() {
        this.last_harmonogram_cache_update = 0;
        this.is_harmonogram_public = true;
        this.public_harmonogram_note = "";
        this.private_harmonogram_note = "";
        this.harmonogram_cache = new ArrayList<Table>();
        this.annotations_per_day_cache = new ArrayList<>();
        this.annotations_cache = new HashMap<>();

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
                this.cell_content_to_be_considered_empty = settings.cell_content_to_be_considered_empty;
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
        TableAndAnnotationsParser table_and_annotations_parser = new TableAndAnnotationsParser(this.sheet_url, this.cell_content_to_be_considered_empty);
        Optional<Triplet<PublicData, List<HashMap<String, AdditionalData>>, List<Table>>> data_opt = table_and_annotations_parser.get_data();
        if(data_opt.isEmpty()) {
            System.err.println("Failed to get table data");
            return;
        }
        Triplet<PublicData, List<HashMap<String, AdditionalData>>, List<Table>> data = data_opt.get();
        PublicData public_data = data.getValue0();
        this.is_harmonogram_public = public_data.is_public;
        this.public_harmonogram_note = public_data.public_text;
        this.private_harmonogram_note = public_data.not_public_text;
        this.harmonogram_cache = data.getValue2();
        List<HashMap<String, AdditionalData>> annotations = data.getValue1();
        this.annotations_per_day_cache = annotations;
        HashMap<String, AdditionalData> annotations_merged = new HashMap<>();
        for(HashMap<String, AdditionalData> day_annotations : annotations) {
            annotations_merged.putAll(day_annotations);
        }
        this.annotations_cache = annotations_merged;
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
        if(this.last_harmonogram_cache_update + this.cache_refresh_cooldown_ms < new Date().getTime()) {
            new Thread(this::fetch_harmonogram).start();
        }
        if(this.harmonogram_cache.isEmpty()) {
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
        String note = this.private_harmonogram_note;
        Optional<List<Table>> table = Optional.empty();
        if(this.is_harmonogram_public) {
            note = this.public_harmonogram_note;
            table = Optional.of(harmonogram_days);
        }
        response.put("data", new TableResponse(this.last_harmonogram_cache_update, table, note));
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    public ResponseEntity<Map<String, Object>> get_annotations(Optional<List<Integer>> days, Optional<List<String>> ids) {
        if(this.last_harmonogram_cache_update + this.cache_refresh_cooldown_ms < new Date().getTime()) {
            new Thread(this::fetch_harmonogram).start();
        }
        if(this.annotations_cache.isEmpty()) {
            this.fetch_harmonogram();
        }
        if(!this.is_harmonogram_public) {
            Map<String, Object> response = new HashMap<>();
            response.put("data", new HashMap<>());
            return new ResponseEntity<>(response, HttpStatus.OK);
        }
        if(days.isEmpty() && ids.isEmpty()) {
            if(this.annotations_cache.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("timestamp", LocalDateTime.now());
                errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
                errorResponse.put("error", "Internal Server Error");
                errorResponse.put("message", "Failed to get annotations data");

                return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("data", new AnnotationsIdsResponse(this.last_harmonogram_cache_update, this.annotations_cache));
            return new ResponseEntity<>(response, HttpStatus.OK);
        } else if(ids.isEmpty()) {
            if(this.annotations_per_day_cache.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("timestamp", LocalDateTime.now());
                errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
                errorResponse.put("error", "Internal Server Error");
                errorResponse.put("message", "Failed to get annotations data");

                return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
            }
            List<Integer> days_all = days.get();
            HashMap<String, HashMap<String, AdditionalData>> annotations = new HashMap<>();
            for (int i : days_all) {
                System.out.println(this.annotations_per_day_cache.size());
                if(i < 0 || i >= this.annotations_per_day_cache.size()) {
                    continue;
                }
                annotations.put(Integer.toString(i), this.annotations_per_day_cache.get(i));
            }
            Map<String, Object> response = new HashMap<>();
            response.put("data", new AnnotationsDaysResponse(this.last_harmonogram_cache_update, annotations));
            return new ResponseEntity<>(response, HttpStatus.OK);
        } else {
            if(this.annotations_cache.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("timestamp", LocalDateTime.now());
                errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
                errorResponse.put("error", "Internal Server Error");
                errorResponse.put("message", "Failed to get annotations data");

                return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
            }
            List<String> ids_all = ids.get();
            HashMap<String, AdditionalData> annotations = new HashMap<>();
            for(String id : ids_all) {
                if(!this.annotations_cache.containsKey(id)) {
                    continue;
                }
                annotations.put(id, this.annotations_cache.get(id));
            }
            Map<String, Object> response = new HashMap<>();
            response.put("data", new AnnotationsIdsResponse(this.last_harmonogram_cache_update, annotations));
            return new ResponseEntity<>(response, HttpStatus.OK);
        }
    }
}

package com.pandicon.gjk_symposion_2023_api.api_controller;

import com.pandicon.gjk_symposion_2023_api.api_model.TableResponse;
import com.pandicon.gjk_symposion_2023_api_service.APIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
public class APIController {
    private APIService api_service;

    @Autowired
    public APIController(APIService i_api_service) {
        this.api_service = i_api_service;
        this.api_service.fetch_harmonogram();
    }

    @GetMapping("/testicek")
    public ResponseEntity<String> test_path(@RequestParam Optional<Integer> id, @RequestParam Optional<List<Integer>> ids) {
        return api_service.get_test(id, ids);
    }

    @GetMapping("/harmonogram")
    public ResponseEntity<Map<String, Object>> get_harmonogram(@RequestParam Optional<List<Integer>> days) {
        return api_service.get_harmonogram(days);
    }

    @GetMapping("/annotations")
    public ResponseEntity<Map<String, Object>> get_annotations(@RequestParam Optional<List<Integer>> days, @RequestParam Optional<List<String>> ids) {
        return api_service.get_annotations(days, ids);
    }
}

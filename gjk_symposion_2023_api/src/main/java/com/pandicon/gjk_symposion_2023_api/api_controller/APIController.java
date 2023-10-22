package com.pandicon.gjk_symposion_2023_api.api_controller;

import com.pandicon.gjk_symposion_2023_api_service.APIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
public class APIController {
    private APIService api_service;

    @Autowired
    public APIController(APIService i_api_service) {
        this.api_service = i_api_service;
    }

    @GetMapping("/testicek")
    public String test_path(@RequestParam Optional<Integer> id) {
        return api_service.get_test(id);
    }
}

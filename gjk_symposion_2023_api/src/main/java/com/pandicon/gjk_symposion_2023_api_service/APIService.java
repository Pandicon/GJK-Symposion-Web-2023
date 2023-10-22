package com.pandicon.gjk_symposion_2023_api_service;

import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class APIService {
    public APIService() {

    }
    public String get_test(Optional<Integer> id_opt) {
        if(id_opt.isEmpty()) {
            return ":D";
        } else {
            int id = id_opt.get();
            return "Here is the number from the parameter: " + id + "<br>" +
                    "Here is the number from the parameter, but squared: " + id * id + "<br>" +
                    ":D";
        }
    }
}

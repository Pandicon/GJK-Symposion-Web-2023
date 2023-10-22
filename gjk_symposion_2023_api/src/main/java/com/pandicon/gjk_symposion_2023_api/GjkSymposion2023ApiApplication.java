package com.pandicon.gjk_symposion_2023_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.pandicon.gjk_symposion_2023_api", "com.pandicon.gjk_symposion_2023_api_service"})
public class GjkSymposion2023ApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(GjkSymposion2023ApiApplication.class, args);
    }

}

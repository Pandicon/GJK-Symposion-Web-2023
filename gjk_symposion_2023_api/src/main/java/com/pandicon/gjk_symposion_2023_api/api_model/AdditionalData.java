package com.pandicon.gjk_symposion_2023_api.api_model;

public class AdditionalData {
    public String id;
    public String annotation;
    public String lecturer_info;
    public AdditionalData(String i_id, String i_annotation, String i_lecturer_info) {
        this.id = i_id;
        this.annotation = i_annotation;
        this.lecturer_info = i_lecturer_info;
    }
}

package com.pandicon.gjk_symposion_2023_api.api_model;

public class TableCell {
    public String lecturer;
    public String title;
    public boolean for_younger;
    public String id;

    public TableCell(String i_lecturer, String i_title, boolean i_for_younger, String i_id) {
        this.lecturer = i_lecturer;
        this.title = i_title;
        this.for_younger = i_for_younger;
        this.id = i_id;
    }
}

package com.pandicon.gjk_symposion_2023_api.api_model;

import java.util.Optional;

public class TableCell {
    public String lecturer;
    public String title;
    public boolean for_younger;
    public Optional<String> id;
    public int rowspan;
    public int colspan;

    public TableCell(String i_lecturer, String i_title, boolean i_for_younger, Optional<String> i_id, int i_rowspan, int i_colspan) {
        this.lecturer = i_lecturer;
        this.title = i_title;
        this.for_younger = i_for_younger;
        this.id = i_id;
        this.rowspan = i_rowspan;
        this.colspan = i_colspan;
    }
}

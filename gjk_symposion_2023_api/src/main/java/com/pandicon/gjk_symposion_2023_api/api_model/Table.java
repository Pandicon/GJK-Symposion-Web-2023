package com.pandicon.gjk_symposion_2023_api.api_model;

import java.util.List;
import java.util.Optional;

public class Table {
    public String day;
    public List<List<Optional<TableCell>>> harmonogram;

    public Table(String i_day, List<List<Optional<TableCell>>> i_harmonogram) {
        this.day = i_day;
        this.harmonogram = i_harmonogram;
    }
}

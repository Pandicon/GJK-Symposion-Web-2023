package com.pandicon.gjk_symposion_2023_api.api_model;

import java.util.List;
import java.util.Optional;

public class TableResponse {
    public long last_updated;
    public Optional<List<Table>> harmonogram;
    public String note;

    public TableResponse(long i_last_updated, Optional<List<Table>> i_harmonogram, String i_note) {
        this.last_updated = i_last_updated;
        this.harmonogram = i_harmonogram;
        this.note = i_note;
    }
}

package com.pandicon.gjk_symposion_2023_api.api_model;

import java.util.List;

public class TableResponse {
    public long last_updated;
    public List<Table> harmonogram;

    public TableResponse(long i_last_updated, List<Table> i_harmonogram) {
        this.last_updated = i_last_updated;
        this.harmonogram = i_harmonogram;
    }
}

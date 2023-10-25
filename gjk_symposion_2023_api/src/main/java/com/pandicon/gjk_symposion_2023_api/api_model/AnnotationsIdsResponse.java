package com.pandicon.gjk_symposion_2023_api.api_model;

import java.util.HashMap;

public class AnnotationsIdsResponse {
    public long last_updated;
    public HashMap<String, AdditionalData> annotations;

    public AnnotationsIdsResponse(long i_last_updated, HashMap<String, AdditionalData> i_annotations) {
        this.last_updated = i_last_updated;
        this.annotations = i_annotations;
    }
}

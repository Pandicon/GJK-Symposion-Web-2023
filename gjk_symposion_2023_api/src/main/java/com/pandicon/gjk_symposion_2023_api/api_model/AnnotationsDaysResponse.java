package com.pandicon.gjk_symposion_2023_api.api_model;

import java.util.HashMap;
import java.util.List;

public class AnnotationsDaysResponse {
    public long last_updated;
    public HashMap<String, HashMap<String, AdditionalData>> annotations;

    public AnnotationsDaysResponse(long i_last_updated, HashMap<String, HashMap<String, AdditionalData>> i_annotations) {
        this.last_updated = i_last_updated;
        this.annotations = i_annotations;
    }
}

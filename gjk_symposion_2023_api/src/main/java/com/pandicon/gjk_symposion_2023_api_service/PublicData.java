package com.pandicon.gjk_symposion_2023_api_service;

public class PublicData {
    public boolean is_public;
    public String public_text;
    public String not_public_text;

    public PublicData(boolean is_public_i, String public_text_i, String not_public_text_i) {
        this.is_public = is_public_i;
        this.public_text = public_text_i;
        this.not_public_text = not_public_text_i;
    }
}

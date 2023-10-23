package com.pandicon.gjk_symposion_2023_api_service;

import com.pandicon.gjk_symposion_2023_api.api_model.Table;
import org.javatuples.Pair;

import java.io.IOException;
import java.io.StringReader;
import java.net.MalformedURLException;
import java.util.*;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URL;
import java.net.URLConnection;
import java.util.stream.Collectors;
import com.opencsv.CSVReader;

class Lecture {
    public String lecturer;
    public String day;
    public String date;
    public String time;
    public String place;
    public String title;
    public String annotation;
    public String lecturer_info;
    public boolean for_younger;
    public Lecture(String lecturer, String date, String place, String title, String annotation, String lecturer_info, String for_younger) {
        this.lecturer = lecturer;
        this.place = place;
        this.title = title;
        this.annotation = annotation;
        this.lecturer_info = lecturer_info;
        this.for_younger = for_younger.strip().equalsIgnoreCase("ano");
        String[] date_time = date.split(" \\| ");
        String[] day_date = date_time[0].split(" ");
        this.day = day_date[0];
        this.date = day_date[1];
        this.time = date_time[1];
        System.out.println(this.day + " " + this.time);
    }
}

public class TableAndAnnotationsParser {
    private final String data_url;

    public TableAndAnnotationsParser(final String i_data_url) {
        this.data_url = i_data_url;
    }

    private Optional<List<List<String>>> read_csv(String input) {
        CSVReader reader = new CSVReader(new StringReader(input));
        List<List<String>> records = new ArrayList<>();
        String[] nextLine;
        try {
            while ((nextLine = reader.readNext()) != null) {
                records.add(List.of(nextLine));
            }
            return Optional.of(records);
        } catch (Exception e) {
            System.err.println("Failed to parse the CSV: " + e);
            return Optional.empty();
        }
    }

    private Optional<String> load_data() {
        try {
            final URLConnection connection = new URL(this.data_url).openConnection();
            connection.setConnectTimeout(15*1000); // Set timeout to 15 seconds
            connection.setReadTimeout(60*1000); // Set read timeout to 60 seconds

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
                final String contents = reader.lines().collect(Collectors.joining("\n"));
                // System.out.println(contents);
                return Optional.of(contents);
            } catch (IOException e) {
                System.err.println("Failed to get connection input stream: " + e);
                return Optional.empty();
            }
        } catch (MalformedURLException e) {
            System.err.println("Failed to create URL: " + e);
            return Optional.empty();
        } catch (IOException e) {
            System.err.println("Failed to create connection: " + e);
            return Optional.empty();
        }
    }

    public Optional<Pair<String, Table>> get_data() {
        final Optional<String> csv_data_opt = this.load_data();
        if(csv_data_opt.isEmpty()) {
            System.out.println("Failed to get the sheet.");
            return Optional.empty();
        }
        final String csv_data_string = csv_data_opt.get();
        final Optional<List<List<String>>> csv_opt = this.read_csv(csv_data_string);
        if(csv_opt.isEmpty()) {
            System.out.println("Failed to parse the CSV.");
            return Optional.empty();
        }
        final List<List<String>> csv = csv_opt.get();
        if(csv.isEmpty() || csv.get(0).isEmpty()) {
            System.err.println("CSV was empty...");
            return Optional.empty();
        }

        int lecturer_i = 0;
        int time_i = 0;
        int place_i = 0;
        int title_i = 0;
        int annotation_i = 0;
        int lecturer_info_i = 0;
        int for_younger_i = 0;

        int top_row_fields = 0;
        int room_annotations_start = 0;
        for(String field : csv.get(0)) {
            if(field.isBlank()) {
                room_annotations_start = top_row_fields + 1;
                break;
            }
            final String cut_lower = field.trim().toLowerCase();
            if(cut_lower.startsWith("přednášející")) {
                lecturer_info_i = top_row_fields;
            } else if(cut_lower.startsWith("čas")) {
                time_i = top_row_fields;
            } else if(cut_lower.startsWith("místo")) {
                place_i = top_row_fields;
            } else if(cut_lower.startsWith("název")) {
                title_i = top_row_fields;
            } else if(cut_lower.startsWith("anotace")) {
                annotation_i = top_row_fields;
            } else if(cut_lower.startsWith("medailonek")) {
                lecturer_info_i = top_row_fields;
            } else if(cut_lower.startsWith("vhodné")) {
                for_younger_i = top_row_fields;
            }
            top_row_fields += 1;
        }
        for(int i = top_row_fields; i < csv.get(0).size(); i += 1) {
            if(!csv.get(0).get(i).isBlank()) {
                break;
            }
            room_annotations_start += 1;
        }
        room_annotations_start -= 1;
        int room_annotations = 0;
        for(int i = room_annotations_start; i < csv.get(0).size(); i += 1) {
            if(csv.get(0).get(i).isBlank()) {
                break;
            }
            room_annotations += 1;
        }
        System.out.println(csv.get(0).get(top_row_fields - 1) + " " + csv.get(0).get(room_annotations_start) + " " + csv.get(0).get(room_annotations_start + room_annotations - 1) + " " + room_annotations_start + " " + room_annotations);
        List<String> rooms = new ArrayList<>();
        List<String> rooms_annotations = new ArrayList<>();
        for(int i = room_annotations_start; i < room_annotations_start + room_annotations; i += 1) {
            rooms.add(csv.get(0).get(i));
            rooms_annotations.add(csv.get(1).get(i));
        }
        System.out.println(rooms.toString() + " " + rooms_annotations.toString());
        System.out.println(lecturer_i + " " + time_i + " " + place_i + " " + title_i + " " + annotation_i + " " + lecturer_info_i + " " + for_younger_i);

        List<Lecture> all_lectures = new ArrayList<>();
        for(int i = 1; i < csv.size(); i += 1) {
            List<String> row = csv.get(i);
            all_lectures.add(new Lecture(row.get(lecturer_i), row.get(time_i), row.get(place_i), row.get(title_i), row.get(annotation_i), row.get(lecturer_info_i), row.get(for_younger_i)));
        }
        all_lectures.sort(Comparator.comparing(lecture -> lecture.date));
        for(Lecture lecture : all_lectures) {
            System.out.println(lecture.date + " " + lecture.day + " " + lecture.lecturer + " " + lecture.for_younger);
        }
        /*
        * Split into days
        * For each day, sort it by the classroom
        * For each day, go through all starting and ending times, saving them, then sort them (eliminating duplicates)
        * For each time, save it to a hashmap or something where it will have its index
        * Split each day into columns of lectures in the same classroom
        * The row span of the lecture is index_of(ending_time) - index_of(starting_time)
        * All spots between the starting and ending time are filled with null or something like that
        * Build the first column out of the sorted times for each day
        * Merge the columns into rows
        * Convert Lecture objects into TableCells, saving their annotations in a different cache by their day-row-column id
        * */

        return Optional.empty();
    }
}

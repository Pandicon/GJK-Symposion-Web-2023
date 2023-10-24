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
    public String starting_time;
    public String ending_time;
    public String place;
    public String title;
    public String annotation;
    public String lecturer_info;
    public boolean for_younger;
    public Lecture(String lecturer, String date, String place, String title, String annotation, String lecturer_info, String for_younger) throws Exception {
        this.lecturer = lecturer.strip();
        this.place = place.strip();
        this.title = title.strip();
        this.annotation = annotation.strip();
        this.lecturer_info = lecturer_info.strip();
        this.for_younger = for_younger.strip().equalsIgnoreCase("ano");
        String[] date_time = date.split(" \\| ");
        if(date_time.length < 2) {
            throw new Exception("Couldn't split day-date by |");
        }
        String[] day_date = date_time[0].split(" ");
        if(day_date.length < 2) {
            throw new Exception("Couldn't split date-time by a space");
        }
        this.day = day_date[0];
        this.date = day_date[1];
        String[] start_end = date_time[1].split("-");
        if(start_end.length < 2) {
            throw new Exception("Couldn't split start-end time by -");
        }
        this.starting_time = start_end[0].strip();
        this.ending_time = start_end[1].strip();
        System.out.println(this.day + " " + this.starting_time + " " + this.ending_time + " " + this.date + " |" + this.lecturer + "| " + this.title);
    }
}

public class TableAndAnnotationsParser {
    private final String data_url;
    private final String cell_content_to_be_considered_empty;

    public TableAndAnnotationsParser(final String i_data_url, final String i_cell_content_to_be_considered_empty) {
        this.data_url = i_data_url;
        this.cell_content_to_be_considered_empty = i_cell_content_to_be_considered_empty;
    }

    private Optional<List<List<String>>> read_csv(String input) {
        CSVReader reader = new CSVReader(new StringReader(input));
        List<List<String>> records = new ArrayList<>();
        String[] nextLine;
        try {
            while ((nextLine = reader.readNext()) != null) {
                List<String> record = new ArrayList<>();
                for(String cell : nextLine) {
                    if(cell.strip().equals(this.cell_content_to_be_considered_empty)) {
                        record.add("");
                    } else {
                        record.add(cell);
                    }
                }
                records.add(record);
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

    private Optional<Pair<String, Table>> handle_day(List<Lecture> day_lectures) {
        /*
         * For each day, go through all starting and ending times, saving them, then sort them (eliminating duplicates) ✔
         * For each time, save it to a hashmap or something where it will have its index ✔
         * For each day, sort it by the classroom
         * Split each day into columns of lectures in the same classroom
         * The row span of the lecture is index_of(ending_time) - index_of(starting_time)
         * All spots between the starting and ending time are filled with null or something like that
         * Build the first column out of the sorted times for each day
         * Merge the columns into rows
         * Convert Lecture objects into TableCells, saving their annotations in a different cache by their day-row-column id
         * */
        HashSet<String> start_end_times_hashset = new HashSet<>();
        for(Lecture lecture : day_lectures) {
            start_end_times_hashset.add(lecture.starting_time);
            start_end_times_hashset.add(lecture.ending_time);
        }
        List<String> start_end_times = new ArrayList<>(start_end_times_hashset);
        Collections.sort(start_end_times);
        System.out.println("Times: " + start_end_times.toString());

        HashMap<String, Integer> time_index = new HashMap<String, Integer>();
        for(int i = 0; i < start_end_times.size(); i += 1) {
            time_index.put(start_end_times.get(i), i);
        }
        System.out.println("Times and indexes: " + time_index);

        return Optional.empty();
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
            System.out.println(row.get(time_i));
            try {
                Lecture lecture = new Lecture(row.get(lecturer_i), row.get(time_i), row.get(place_i), row.get(title_i), row.get(annotation_i), row.get(lecturer_info_i), row.get(for_younger_i));
                all_lectures.add(lecture);
            } catch (Exception e) {
                e.printStackTrace(System.err);
            }
        }
        all_lectures.sort(Comparator.comparing(lecture -> lecture.date));

        List<List<Lecture>> lecture_days = new ArrayList<>();
        String current_date = "";
        for(Lecture lecture : all_lectures) {
            if(!Objects.equals(current_date, lecture.date)) {
                lecture_days.add(new ArrayList<>());
                current_date = lecture.date;
            }
            lecture_days.get(lecture_days.size() - 1).add(lecture);
            System.out.println(lecture.date + " " + lecture.day + " " + lecture.lecturer + " " + lecture.for_younger);
        }
        System.out.println("Days separated: " + lecture_days.size());

        for(List<Lecture> day : lecture_days) {
            this.handle_day(day);
        }

        /*
        * Split into days ✔
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

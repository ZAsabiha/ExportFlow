package com.example.exportsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ExportsystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(ExportsystemApplication.class, args);
	}

}

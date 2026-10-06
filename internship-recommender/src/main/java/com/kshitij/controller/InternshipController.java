package com.kshitij.controller;

import com.kshitij.model.Internship;
import com.kshitij.repository.InternshipRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "http://127.0.0.1:5500")
@RestController
@RequestMapping("/internships")
public class InternshipController {

    private final InternshipRepository repository;

    public InternshipController(InternshipRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Internship> getInternships() {
        return repository.findAll();
    }

    @GetMapping("/company/{company}")
    public List<Internship> getInternshipsByCompany(@PathVariable String company) {
        return repository.findByCompany(company);
    }

    @GetMapping("/state/{state}")
    public List<Internship> getInternshipsByState(@PathVariable String state) {
    return repository.findByState(state);
    }
     
    @GetMapping("/role/{role}")
    public List<Internship> getInternshipsByRole(@PathVariable String role) {
    return repository.findByRole(role);
    }
    
    @GetMapping("/qualification/{qualification}")
    public List<Internship> getInternshipsByQualification(@PathVariable String qualification) {
    return repository.findByQualification(qualification);
    }

    @GetMapping("/stipend/{stipend}")
    public List<Internship> getInternshipsByStipend(@PathVariable int stipend) {
    return repository.findByStipend(stipend); 
    }
     
   @GetMapping("/duration/{duration}")
    public List<Internship> getInternshipsByDuration(@PathVariable int duration) {
    return repository.findByDuration(duration);
    }

    @GetMapping("/sector/{sector}")
    public List<Internship> getInternshipsBySector(@PathVariable String sector) {
    return repository.findBySector(sector);
    }
    
    
    



    @PostMapping
    public Internship addInternship(@RequestBody Internship internship) {
        return repository.save(internship);
    }
}
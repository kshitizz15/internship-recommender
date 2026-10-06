package com.kshitij.repository;

import com.kshitij.model.Internship;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InternshipRepository extends JpaRepository<Internship, Long> {

    List<Internship> findByCompany(String company);

    List<Internship> findByState(String state);

    List<Internship> findByStipend(int stipend);

    List<Internship> findByRole(String role);

    List<Internship> findBySector(String sector);

    List<Internship> findByQualification(String qualification);

    List<Internship> findByDuration(int duration);

}
 package com.monprojet.factory.repository;

import com.monprojet.factory.entity.CompresseurData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.ZonedDateTime;


@Repository
public interface CompresseurDataRepository extends JpaRepository<CompresseurData, Long> {
    List<CompresseurData> findAllByOrderByTimestampAsc();
    List<CompresseurData> findAllByTimestampBetween(ZonedDateTime start, ZonedDateTime end);

}



-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: dailylog_db
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `daily_task_completions`
--

DROP TABLE IF EXISTS `daily_task_completions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_task_completions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `task_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `completed_date` date NOT NULL,
  `earned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `footnote` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_task_day` (`task_id`,`completed_date`),
  KEY `idx_completed_date` (`completed_date`),
  KEY `idx_task_id` (`task_id`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_task_completions`
--

LOCK TABLES `daily_task_completions` WRITE;
/*!40000 ALTER TABLE `daily_task_completions` DISABLE KEYS */;
INSERT INTO `daily_task_completions` VALUES (1,7,'Vocab Review: 100 words','2025-12-13','2025-12-13 17:28:43',NULL),(2,11,'Try New Thing: 1 pcs','2025-12-14','2025-12-14 22:44:12',NULL),(3,10,'Walk 10,000 steps','2025-12-14','2025-12-14 22:44:16',NULL),(4,7,'Vocab Review: 100 words','2025-12-14','2025-12-14 22:44:17',NULL),(5,6,'Qualcomm Blog: 1 pcs','2025-12-14','2025-12-14 22:44:19',NULL),(7,4,'Practice coding','2026-01-02','2026-01-03 01:26:03',NULL),(8,15,'Listen to 1 immigration podcast','2026-01-02','2026-01-03 01:26:07',NULL),(9,7,'Review Vocab: 100 words','2026-01-02','2026-01-03 01:26:10',NULL),(10,10,'Walk 10,000 steps','2026-01-02','2026-01-03 01:26:12',NULL),(11,13,'Review 1 Job Description','2026-01-02','2026-01-03 01:26:19',NULL),(12,11,'Try New Thing: 1 pcs','2026-01-02','2026-01-03 01:26:21',NULL),(13,4,'Practice coding','2026-01-03','2026-01-03 22:43:40',NULL),(14,11,'Try New Thing: 1 pcs','2026-01-03','2026-01-03 22:43:49',NULL),(15,16,'µö╢τƒ¡Σ┐í','2026-01-03','2026-01-03 22:43:51',NULL),(16,10,'Walk 10,000 steps','2026-01-03','2026-01-03 22:44:22',NULL),(17,7,'Review Vocab: 100 words','2026-01-03','2026-01-03 22:44:28',NULL),(18,15,'Listen to 1 immigration podcast','2026-01-03','2026-01-04 13:44:56',NULL),(20,16,'µö╢τƒ¡Σ┐í','2026-01-04','2026-01-04 13:47:08',NULL),(21,7,'Review Vocab: 100 words','2026-01-04','2026-01-04 20:22:57',NULL),(22,10,'Walk 10,000 steps','2026-01-04','2026-01-04 20:23:02',NULL),(23,15,'Listen to Immd podcast: 1 pcs','2026-01-04','2026-01-04 20:23:09',NULL),(25,11,'Try New Thing: 1 pcs','2026-01-04','2026-01-05 14:38:24',NULL),(26,4,'Practice coding question: 1 pcs','2026-01-04','2026-01-05 14:38:31',NULL),(27,13,'Review 1 Job Description','2026-01-04','2026-01-05 14:39:26',NULL),(28,4,'Practice coding question: 1 pcs','2026-01-05','2026-01-05 22:56:58',NULL),(29,6,'Qualcomm Blog: 1 pcs','2026-01-05','2026-01-05 22:57:05',NULL),(30,10,'Walk 10,000 steps','2026-01-05','2026-01-05 22:57:09',NULL),(31,12,'Learn DSA or Vibe Coding trick: 1 pcs','2026-01-05','2026-01-05 22:57:12',NULL),(32,13,'Review 1 Job Description','2026-01-05','2026-01-05 22:57:16',NULL),(33,15,'Listen to Immd podcast: 1 pcs','2026-01-05','2026-01-06 00:14:42',NULL),(34,16,'µö╢τƒ¡Σ┐í','2026-01-05','2026-01-06 00:14:45',NULL),(35,7,'Review Vocab: 100 words','2026-01-05','2026-01-06 00:14:48',NULL),(37,11,'Try New Thing: 1 pcs','2026-01-05','2026-01-06 22:27:19',NULL),(38,15,'Listen to Immd podcast: 1 pcs','2026-01-06','2026-01-06 22:27:31',NULL),(39,6,'Qualcomm Blog: 1 pcs','2026-01-06','2026-01-06 22:27:37',NULL),(40,7,'Review Vocab: 100 words','2026-01-06','2026-01-06 22:27:41',NULL),(41,10,'Walk 10,000 steps','2026-01-06','2026-01-06 22:27:42',NULL),(42,13,'Review 1 Job Description','2026-01-06','2026-01-06 22:27:47',NULL),(43,11,'Try New Thing: 1 pcs','2026-01-06','2026-01-06 22:27:49',NULL),(44,16,'µö╢τƒ¡Σ┐í','2026-01-06','2026-01-07 01:10:54',NULL),(46,16,'µö╢τƒ¡Σ┐í','2026-01-07','2026-01-07 12:57:14',NULL),(47,6,'Qualcomm Blog: 1 pcs','2026-01-07','2026-01-07 12:58:02',NULL),(48,15,'Listen to Immd podcast: 1 pcs','2026-01-08','2026-01-09 14:10:45',NULL),(49,6,'Qualcomm or Edge AI blog: 1 pcs','2026-01-08','2026-01-09 14:10:50',NULL),(50,7,'Review Vocab: 100 words','2026-01-08','2026-01-09 14:10:52',NULL),(51,9,'Read TinyML Book','2026-01-08','2026-01-09 14:10:56',NULL),(59,11,'Try New Thing: 1 pcs','2026-01-09','2026-01-10 14:22:01',NULL),(60,14,'Learn 1 Linux know-how','2026-01-09','2026-01-10 14:22:03',NULL),(61,13,'Review 2 JDs (AU and Overseas)','2026-01-09','2026-01-10 14:22:04',NULL),(62,10,'Walk 10,000 steps','2026-01-09','2026-01-10 14:22:05',NULL),(63,7,'Review Vocab: 100 words','2026-01-09','2026-01-10 14:22:07',NULL),(64,15,'Listen to Immd podcast: 1 pcs','2026-01-09','2026-01-10 14:22:24',NULL),(65,16,'µö╢τƒ¡Σ┐í','2026-01-10','2026-01-10 14:22:41',NULL),(66,10,'Walk 10,000 steps','2026-01-10','2026-01-11 04:03:49',NULL),(67,13,'Review 2 JDs (AU and Overseas)','2026-01-10','2026-01-11 04:04:08',NULL),(68,14,'Learn 1 Linux know-how','2026-01-10','2026-01-11 04:04:14',NULL),(69,7,'Review Vocab: 100 words','2026-01-10','2026-01-11 04:04:17',NULL),(70,6,'Qualcomm or Edge AI blog: 1 pcs','2026-01-10','2026-01-11 04:04:20',NULL),(71,15,'Listen to Immd podcast: 1 pcs','2026-01-10','2026-01-11 04:04:26',NULL),(72,11,'Try New Thing: 1 pcs','2026-01-10','2026-01-11 04:05:07',NULL),(73,7,'Review Vocab: 100 words','2026-01-12','2026-01-13 02:00:50',NULL),(74,16,'µö╢τƒ¡Σ┐í','2026-01-12','2026-01-13 02:00:53',NULL),(75,13,'Review 2 JDs (AU and Overseas)','2026-01-12','2026-01-13 02:01:35',NULL),(76,15,'Listen to Immd podcast: 1 pcs','2026-01-12','2026-01-13 02:01:46',NULL),(77,12,'Learn DSA or Vibe Coding trick: 1 pcs','2026-01-12','2026-01-13 02:01:53','Learnt slash command'),(78,10,'Walk 10000 steps','2026-01-12','2026-01-13 02:13:25','8000 steps'),(79,7,'Review Vocab: 100 words','2026-01-13','2026-01-13 06:24:41',NULL),(80,16,'µö╢τƒ¡Σ┐í','2026-01-15','2026-01-15 16:56:46',NULL),(81,16,'µö╢τƒ¡Σ┐í','2026-01-14','2026-01-15 17:35:10',NULL),(82,10,'Walk 10000 steps','2026-01-14','2026-01-15 17:35:12',NULL),(83,15,'Listen to Immd podcast: 1 pcs','2026-01-14','2026-01-15 17:35:22',NULL),(84,7,'Review Vocab: 60 words','2026-01-14','2026-01-15 17:35:27',NULL),(85,11,'Try New Thing: 1 pcs','2026-01-14','2026-01-15 17:35:37','σ░¥Φ»òColesµ¥éµ₧£Φè▒τöƒ'),(86,13,'Review 2 JDs (AU and Overseas)','2026-01-14','2026-01-15 17:35:48',NULL),(87,16,'µö╢τƒ¡Σ┐í','2026-01-13','2026-01-15 17:36:37',NULL),(88,10,'Walk 10000 steps','2026-01-15','2026-01-16 21:54:29',NULL),(89,13,'Review 2 JDs (AU and Overseas)','2026-01-15','2026-01-16 21:55:09',NULL),(90,15,'Listen to Immd podcast: 1 pcs','2026-01-15','2026-01-16 21:55:20',NULL),(91,7,'Review Vocab: 60 words','2026-01-15','2026-01-16 21:55:30',NULL),(92,11,'Try New Thing: 1 pcs','2026-01-15','2026-01-16 21:55:36',NULL),(93,15,'Listen to Immd podcast: 1 pcs','2026-01-25','2026-01-25 23:26:32',NULL),(94,7,'Review Vocab: 60 words','2026-01-25','2026-01-25 23:26:38',NULL),(95,13,'Review 2 JDs (AU and Overseas)','2026-01-25','2026-01-25 23:26:41',NULL),(96,10,'Walk 10000 steps','2026-01-25','2026-01-25 23:26:54',NULL),(97,12,'Learn DSA or Vibe Coding trick: 1 pcs','2026-02-01','2026-02-01 01:35:58',NULL),(98,15,'Listen to Immd podcast: 1 pcs','2026-02-01','2026-02-01 01:36:02',NULL),(99,10,'Walk 10000 steps','2026-02-01','2026-02-01 01:36:11',NULL),(100,16,'µö╢τƒ¡Σ┐í','2026-02-01','2026-02-01 01:36:13',NULL);
/*!40000 ALTER TABLE `daily_task_completions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `position` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_position` (`position`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,'Exercise for 30 minutes','2025-12-13 17:03:45',0,0),(2,'Read a book','2025-12-13 17:03:45',0,0),(3,'Write in journal','2025-12-13 17:03:45',0,0),(4,'Practice coding question: 1 pcs','2025-12-13 17:03:45',1,0),(5,'Meditate for 10 minutes','2025-12-13 17:03:45',0,0),(6,'Qualcomm or Edge AI blog: 1 pcs','2025-12-13 17:28:14',1,5),(7,'Review Vocab: 60 words','2025-12-13 17:28:40',1,6),(8,'Python Practice','2025-12-13 17:29:08',0,0),(9,'Read TinyML Book','2025-12-13 17:29:31',1,7),(10,'Walk 10000 steps','2025-12-13 17:30:09',1,9),(11,'Try New Thing: 1 pcs','2025-12-14 22:44:11',1,10),(12,'Learn DSA or Vibe Coding trick: 1 pcs','2025-12-15 00:48:44',1,1),(13,'Review 1 JD (AU or Overseas)','2026-01-02 14:34:48',1,8),(14,'Learn 1 Linux know-how','2026-01-02 14:39:41',1,4),(15,'Listen to Immd podcast: 1 pcs','2026-01-02 14:50:31',1,2),(16,'µö╢τƒ¡Σ┐í','2026-01-03 14:44:22',1,11),(17,'Practice ML model script: 1 pcs','2026-01-04 21:21:39',1,3);
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-08 22:28:01

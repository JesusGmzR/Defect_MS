CREATE TABLE `defect_data` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `defecto`          VARCHAR(120)    NOT NULL,
  `fecha`            DATE            NOT NULL,
  `linea`            VARCHAR(50)     NOT NULL,
  `codigo`           VARCHAR(64)     NOT NULL,
  `modelo`           VARCHAR(120)    NOT NULL,
  `ubicacion`        VARCHAR(120)    NULL,
  `area_responsable` VARCHAR(50)     NOT NULL,
  `capturista`       VARCHAR(100)    NOT NULL,
  `hora_captura`     TIME            NOT NULL,
  `area_captura`     VARCHAR(120)    NOT NULL,


  PRIMARY KEY (`id`),
  KEY `idx_fecha`   (`fecha`),
  KEY `idx_linea`   (`linea`),
  KEY `idx_codigo`  (`codigo`),
  KEY `idx_arear`   (`area_responsable`),
  KEY `idx_areac`   (`area_captura`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


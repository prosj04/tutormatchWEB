-- Teacher.hourlyRateKrw: 정산 시급 수동 지정 (null = 기본 30,000원)
ALTER TABLE "Teacher" ADD COLUMN "hourlyRateKrw" INTEGER;

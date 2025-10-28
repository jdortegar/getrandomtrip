-- AddPackagePreferenceMatching
ALTER TABLE "packages" ADD COLUMN "excuseKey" TEXT;
ALTER TABLE "packages" ADD COLUMN "detailsOptions" TEXT[] DEFAULT ARRAY[]::TEXT[];

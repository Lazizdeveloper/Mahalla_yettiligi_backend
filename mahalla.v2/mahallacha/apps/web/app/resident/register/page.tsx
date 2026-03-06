"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  type ApiDistrict,
  ApiError,
  type ApiMahalla,
  type ApiRegion,
  enforceUzPhoneInput,
  registerAholiUser,
  requestLoginOtp,
  suggestPublicDistricts,
  suggestPublicMahallas,
  suggestPublicRegions
} from "@/lib/api";

export default function ResidentRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [regions, setRegions] = useState<ApiRegion[]>([]);
  const [districts, setDistricts] = useState<ApiDistrict[]>([]);
  const [mahallas, setMahallas] = useState<Array<Pick<ApiMahalla, "id" | "name" | "districtId">>>([]);
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedMahallaId, setSelectedMahallaId] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_MAHALLA_ID ?? ""
  );
  const [regionInput, setRegionInput] = useState("");
  const [districtInput, setDistrictInput] = useState("");
  const [mahallaInput, setMahallaInput] = useState("");
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingMahallas, setIsLoadingMahallas] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [devCodePreview, setDevCodePreview] = useState("");
  const isValidUzPhone = (value: string) => /^\+998\d{9}$/.test(value.trim());

  const getErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "Kutilmagan xatolik yuz berdi.";
  };

  const loadRegions = async () => {
    setIsLoadingRegions(true);
    try {
      const items = await suggestPublicRegions("", 12);
      setRegions(items);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoadingRegions(false);
    }
  };

  useEffect(() => {
    void loadRegions();
  }, []);

  const handleRegionInputChange = async (value: string) => {
    setRegionInput(value);
    setSelectedRegionId("");
    setSelectedDistrictId("");
    setSelectedMahallaId("");
    setDistrictInput("");
    setMahallaInput("");
    setDistricts([]);
    setMahallas([]);

    const query = value.trim();
    setIsLoadingRegions(true);
    try {
      const items = await suggestPublicRegions(query, 12);
      setRegions(items);
      const matchedRegion = items.find(
        (region) => region.name.trim().toLowerCase() === query.toLowerCase()
      );
      if (!matchedRegion) {
        return;
      }

      setSelectedRegionId(matchedRegion.id);
      setIsLoadingDistricts(true);
      try {
        const districtItems = await suggestPublicDistricts(matchedRegion.id, "", 12);
        setDistricts(districtItems);
      } finally {
        setIsLoadingDistricts(false);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoadingRegions(false);
    }
  };

  const handleDistrictInputChange = async (value: string) => {
    setDistrictInput(value);
    setSelectedDistrictId("");
    setSelectedMahallaId("");
    setMahallaInput("");
    setMahallas([]);

    if (!selectedRegionId) {
      return;
    }

    const query = value.trim();
    setIsLoadingDistricts(true);
    setIsLoadingMahallas(true);
    try {
      const districtItems = await suggestPublicDistricts(selectedRegionId, query, 12);
      setDistricts(districtItems);
      const matchedDistrict = districtItems.find(
        (district) => district.name.trim().toLowerCase() === query.toLowerCase()
      );
      if (!matchedDistrict) {
        return;
      }

      setSelectedDistrictId(matchedDistrict.id);
      const items = await suggestPublicMahallas(matchedDistrict.id, "", 12);
      setMahallas(items);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoadingDistricts(false);
      setIsLoadingMahallas(false);
    }
  };

  const handleMahallaInputChange = async (value: string) => {
    setMahallaInput(value);
    setSelectedMahallaId("");

    if (!selectedDistrictId) {
      return;
    }

    setIsLoadingMahallas(true);
    try {
      const items = await suggestPublicMahallas(selectedDistrictId, value.trim(), 12);
      setMahallas(items);
      const matchedMahalla = items.find(
        (mahalla) => mahalla.name.trim().toLowerCase() === value.trim().toLowerCase()
      );
      setSelectedMahallaId(matchedMahalla?.id ?? "");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoadingMahallas(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setDevCodePreview("");
    setIsSubmitting(true);

    try {
      const effectiveMahallaId =
        selectedMahallaId.trim() || process.env.NEXT_PUBLIC_DEFAULT_MAHALLA_ID?.trim() || "";
      if (!effectiveMahallaId) {
        setErrorMessage("Mahallani tanlang.");
        return;
      }
      if (!isValidUzPhone(phone)) {
        setErrorMessage("Telefon raqam +998XXXXXXXXX formatida bolishi kerak.");
        return;
      }

      await registerAholiUser(fullName, phone, effectiveMahallaId);
      const otpResponse = await requestLoginOtp("app", phone);
      setSuccessMessage("Royxatdan otish yakunlandi. Endi login sahifasida OTP bilan kiring.");
      if (otpResponse.otpCode) {
        setDevCodePreview(otpResponse.otpCode);
      }

      setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden resident-mesh-dark">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="resident-blob resident-blob-glow absolute top-[10%] left-[5%] w-[320px] h-[320px] bg-blue-600/25"
          style={{ animationDuration: "24s", animationDelay: "0s" }}
        />
        <div
          className="resident-blob absolute top-[50%] right-[10%] w-[400px] h-[400px] bg-sky-600/20"
          style={{ animationDuration: "28s", animationDelay: "-5s" }}
        />
        <div
          className="resident-blob resident-blob-glow absolute bottom-[15%] left-[15%] w-[280px] h-[280px] bg-cyan-600/20"
          style={{ animationDuration: "26s", animationDelay: "-10s" }}
        />
        <div
          className="resident-blob absolute top-[30%] right-[30%] w-[200px] h-[200px] bg-blue-700/15"
          style={{ animationDuration: "20s", animationDelay: "-3s" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="resident-card resident-card-hover p-6 sm:p-8 shadow-2xl border-white/10 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Aholi - Royxatdan otish</h1>
            <p className="text-sm text-slate-400">
              Mahalla Monitoring va Boshqaruv Platformasida yangi foydalanuvchi yarating
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 resident-form">
            {errorMessage && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 space-y-1">
                <p>{successMessage}</p>
                {devCodePreview && (
                  <p className="font-mono text-xs text-emerald-100">Dev code: {devCodePreview}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">F.I.Sh</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Familiya Ism Sharif"
                className="w-full rounded-xl border px-4 py-3 text-sm placeholder-slate-400 transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Telefon raqam</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(enforceUzPhoneInput(e.target.value))}
                placeholder="+998 90 123 45 67"
                inputMode="numeric"
                minLength={13}
                maxLength={13}
                className="w-full rounded-xl border px-4 py-3 text-sm placeholder-slate-400 transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Viloyat</label>
              <input
                type="text"
                list="register-region-options"
                value={regionInput}
                onChange={(e) => void handleRegionInputChange(e.target.value)}
                placeholder={isLoadingRegions ? "Yuklanmoqda..." : "Viloyatni yozing"}
                className="w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 bg-slate-900/60 border-slate-700 text-slate-100 placeholder-slate-400"
                required
              />
              <datalist id="register-region-options">
                {regions.map((region) => (
                  <option key={region.id} value={region.name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Tuman</label>
              <input
                type="text"
                list="register-district-options"
                value={districtInput}
                onChange={(e) => void handleDistrictInputChange(e.target.value)}
                disabled={!selectedRegionId}
                placeholder={
                  !selectedRegionId
                    ? "Avval viloyatni yozing"
                    : isLoadingDistricts
                      ? "Yuklanmoqda..."
                      : "Tumanni yozing"
                }
                className="w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 bg-slate-900/60 border-slate-700 text-slate-100 placeholder-slate-400 disabled:opacity-60"
                required
              />
              <datalist id="register-district-options">
                {districts.map((district) => (
                  <option key={district.id} value={district.name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Mahalla</label>
              <input
                type="text"
                list="register-mahalla-options"
                value={mahallaInput}
                onChange={(e) => void handleMahallaInputChange(e.target.value)}
                disabled={!selectedDistrictId}
                placeholder={
                  !selectedDistrictId
                    ? "Avval tumanni yozing"
                    : isLoadingMahallas
                      ? "Yuklanmoqda..."
                      : "Mahallani yozing"
                }
                className="w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 bg-slate-900/60 border-slate-700 text-slate-100 placeholder-slate-400 disabled:opacity-60"
                required
              />
              <datalist id="register-mahalla-options">
                {mahallas.map((mahalla) => (
                  <option key={mahalla.id} value={mahalla.name} />
                ))}
              </datalist>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 bg-gradient-to-r from-emerald-500 via-sky-500 to-cyan-500 hover:shadow-emerald-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Yuborilmoqda..." : "Royxatdan otish"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}

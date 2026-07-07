"use client";

import { useMemo, useState } from "react";

import {
  SERVICE_REGION_GROUPS,
  SEOUL_STATION_OPTIONS,
  STATION_PLACEHOLDER,
  formatRegion,
  matchesRegionQuery,
} from "@/lib/service-regions";

/**
 * 지역 선택: 서울|동탄 탭 → 아코디언(서울: 구 → 인접 지하철역(없음 가능), 동탄: 법정동).
 * value 형식: "서울 강남구 · 역삼역" / "서울 강남구" / "동탄 반송동"
 */
export function RegionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (region: string) => void;
}) {
  const [groupId, setGroupId] = useState<string>("");
  const [district, setDistrict] = useState("");
  const [station, setStation] = useState("");
  const [openStep, setOpenStep] = useState<"district" | "station" | null>(null);
  const [query, setQuery] = useState("");

  const group = SERVICE_REGION_GROUPS.find((g) => g.id === groupId);
  const isSeoul = groupId === "seoul";

  const options = useMemo(() => {
    if (openStep === "district" && group) {
      return group.units.filter((u) => matchesRegionQuery(u, query)).slice(0, 40);
    }
    if (openStep === "station") {
      return SEOUL_STATION_OPTIONS.filter((u) => matchesRegionQuery(u, query)).slice(0, 40);
    }
    return [];
  }, [group, openStep, query]);

  const selectTab = (id: string) => {
    setGroupId(id);
    setDistrict("");
    setStation("");
    setQuery("");
    setOpenStep("district");
    onChange("");
  };

  const openAccordion = (step: "district" | "station") => {
    setQuery("");
    setOpenStep((prev) => (prev === step ? null : step));
  };

  const selectDistrict = (unit: string) => {
    if (!group) return;
    setDistrict(unit);
    setStation("");
    setQuery("");
    if (isSeoul) {
      setOpenStep("station");
      onChange("");
    } else {
      setOpenStep(null);
      onChange(formatRegion(group.label, unit));
    }
  };

  const selectStation = (name: string | null) => {
    if (!group || !district) return;
    setStation(name ?? "없음");
    setQuery("");
    setOpenStep(null);
    onChange(formatRegion(group.label, district, name ?? undefined));
  };

  return (
    <div className="region-picker">
      <div className="region-picker-tabs" role="group" aria-label="지역 선택">
        {SERVICE_REGION_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`region-tab${groupId === g.id ? " on" : ""}`}
            onClick={() => selectTab(g.id)}
          >
            {g.label}
          </button>
        ))}
      </div>

      {group ? (
        <div className="region-picker-body">
          <button
            type="button"
            className={`region-acc-head${openStep === "district" ? " open" : ""}`}
            onClick={() => openAccordion("district")}
            aria-expanded={openStep === "district"}
          >
            <span>{group.unitLabel} 선택</span>
            <strong>{district || "—"}</strong>
          </button>
          {openStep === "district" && (
            <div className="region-acc-body">
              <input
                type="text"
                value={query}
                placeholder={group.placeholder}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={`${group.label} ${group.unitLabel} 검색`}
              />
              <ul className="region-options" role="listbox">
                {options.length === 0 ? (
                  <li className="region-empty">검색 결과가 없습니다</li>
                ) : (
                  options.map((u) => (
                    <li key={u}>
                      <button type="button" onClick={() => selectDistrict(u)}>
                        {u}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {isSeoul && district ? (
            <>
              <button
                type="button"
                className={`region-acc-head${openStep === "station" ? " open" : ""}`}
                onClick={() => openAccordion("station")}
                aria-expanded={openStep === "station"}
              >
                <span>인접 지하철역</span>
                <strong>{station || "—"}</strong>
              </button>
              {openStep === "station" && (
                <div className="region-acc-body">
                  <input
                    type="text"
                    value={query}
                    placeholder={STATION_PLACEHOLDER}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="인접 지하철역 검색"
                  />
                  <button
                    type="button"
                    className="region-none-btn"
                    onClick={() => selectStation(null)}
                  >
                    인접 지하철역 없음
                  </button>
                  <ul className="region-options" role="listbox">
                    {options.length === 0 ? (
                      <li className="region-empty">검색 결과가 없습니다</li>
                    ) : (
                      options.map((u) => (
                        <li key={u}>
                          <button type="button" onClick={() => selectStation(u)}>
                            {u}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </>
          ) : null}

          {value ? <p className="region-selected">선택됨: {value}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

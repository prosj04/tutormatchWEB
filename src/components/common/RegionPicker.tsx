"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  SERVICE_REGION_GROUPS,
  SEOUL_STATION_OPTIONS,
  STATION_PLACEHOLDER,
  formatRegion,
  matchesRegionQuery,
} from "@/lib/service-regions";

const NONE_STATION = "없음";

function ComboField({
  label,
  placeholder,
  selected,
  options,
  onSelect,
  pinnedOption,
  autoOpen,
}: {
  label: string;
  placeholder: string;
  selected: string;
  options: readonly string[];
  onSelect: (value: string) => void;
  pinnedOption?: string;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen ?? false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const filtered = useMemo(
    () => options.filter((u) => matchesRegionQuery(u, query)).slice(0, 40),
    [options, query],
  );

  const pick = (value: string) => {
    onSelect(value);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={rootRef} className={`region-combo${open ? " open" : ""}`}>
      <span className="region-combo-label">{label}</span>
      <input
        ref={inputRef}
        type="text"
        value={open ? query : selected}
        placeholder={selected || placeholder}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onClick={() => setOpen(true)}
        onChange={(e) => setQuery(e.target.value)}
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls=""
        aria-autocomplete="list"
      />
      <span className="region-combo-caret" aria-hidden="true">▾</span>
      {open ? (
        <ul className="region-options" role="listbox">
          {pinnedOption ? (
            <li key="__none__">
              <button type="button" className="region-option-none" onClick={() => pick(pinnedOption)}>
                {pinnedOption}
              </button>
            </li>
          ) : null}
          {filtered.length === 0 ? (
            <li className="region-empty">검색 결과가 없습니다</li>
          ) : (
            filtered.map((u) => (
              <li key={u}>
                <button type="button" onClick={() => pick(u)}>
                  {u}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * 지역 선택: 서울|동탄 탭 → 콤보박스(누르면 목록이 아래로 펼쳐지고 입력하면 실시간 필터).
 * 서울: 구 → 인접 지하철역(없음 선택 가능), 동탄: 법정동.
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

  const group = SERVICE_REGION_GROUPS.find((g) => g.id === groupId);
  const isSeoul = groupId === "seoul";

  const selectTab = (id: string) => {
    setGroupId(id);
    setDistrict("");
    setStation("");
    onChange("");
  };

  const selectDistrict = (unit: string) => {
    if (!group) return;
    setDistrict(unit);
    setStation(NONE_STATION);
    onChange(formatRegion(group.label, unit));
  };

  const selectStation = (name: string) => {
    if (!group || !district) return;
    setStation(name);
    onChange(
      name === NONE_STATION
        ? formatRegion(group.label, district)
        : formatRegion(group.label, district, name),
    );
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
          <ComboField
            key={`${groupId}-district`}
            label={`${group.unitLabel} 선택`}
            placeholder={group.placeholder}
            selected={district}
            options={group.units}
            onSelect={selectDistrict}
            autoOpen
          />
          {isSeoul && district ? (
            <ComboField
              key={`${district}-station`}
              label="인접 지하철역"
              placeholder={STATION_PLACEHOLDER}
              selected={station}
              options={SEOUL_STATION_OPTIONS}
              onSelect={selectStation}
              pinnedOption={NONE_STATION}
            />
          ) : null}
          {value ? <p className="region-selected">선택됨: {value}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

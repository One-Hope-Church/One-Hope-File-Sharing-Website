"use client";

import { useState, useEffect, useRef } from "react";

const US_STATES = [
  { value: "", label: "Select state" },
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

const COUNTRIES: { value: string; label: string }[] = [
  { value: "US", label: "United States" },
  { value: "AF", label: "Afghanistan" },
  { value: "AL", label: "Albania" },
  { value: "DZ", label: "Algeria" },
  { value: "AD", label: "Andorra" },
  { value: "AO", label: "Angola" },
  { value: "AG", label: "Antigua and Barbuda" },
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaijan" },
  { value: "BS", label: "Bahamas" },
  { value: "BH", label: "Bahrain" },
  { value: "BD", label: "Bangladesh" },
  { value: "BB", label: "Barbados" },
  { value: "BY", label: "Belarus" },
  { value: "BE", label: "Belgium" },
  { value: "BZ", label: "Belize" },
  { value: "BJ", label: "Benin" },
  { value: "BT", label: "Bhutan" },
  { value: "BO", label: "Bolivia" },
  { value: "BA", label: "Bosnia and Herzegovina" },
  { value: "BW", label: "Botswana" },
  { value: "BR", label: "Brazil" },
  { value: "BN", label: "Brunei" },
  { value: "BG", label: "Bulgaria" },
  { value: "BF", label: "Burkina Faso" },
  { value: "BI", label: "Burundi" },
  { value: "CV", label: "Cabo Verde" },
  { value: "KH", label: "Cambodia" },
  { value: "CM", label: "Cameroon" },
  { value: "CA", label: "Canada" },
  { value: "CF", label: "Central African Republic" },
  { value: "TD", label: "Chad" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CO", label: "Colombia" },
  { value: "KM", label: "Comoros" },
  { value: "CG", label: "Congo" },
  { value: "CD", label: "Congo (Democratic Republic)" },
  { value: "CR", label: "Costa Rica" },
  { value: "HR", label: "Croatia" },
  { value: "CU", label: "Cuba" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czech Republic" },
  { value: "DK", label: "Denmark" },
  { value: "DJ", label: "Djibouti" },
  { value: "DM", label: "Dominica" },
  { value: "DO", label: "Dominican Republic" },
  { value: "EC", label: "Ecuador" },
  { value: "EG", label: "Egypt" },
  { value: "SV", label: "El Salvador" },
  { value: "GQ", label: "Equatorial Guinea" },
  { value: "ER", label: "Eritrea" },
  { value: "EE", label: "Estonia" },
  { value: "SZ", label: "Eswatini" },
  { value: "ET", label: "Ethiopia" },
  { value: "FJ", label: "Fiji" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "GA", label: "Gabon" },
  { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "GR", label: "Greece" },
  { value: "GD", label: "Grenada" },
  { value: "GT", label: "Guatemala" },
  { value: "GN", label: "Guinea" },
  { value: "GW", label: "Guinea-Bissau" },
  { value: "GY", label: "Guyana" },
  { value: "HT", label: "Haiti" },
  { value: "HN", label: "Honduras" },
  { value: "HK", label: "Hong Kong" },
  { value: "HU", label: "Hungary" },
  { value: "IS", label: "Iceland" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IR", label: "Iran" },
  { value: "IQ", label: "Iraq" },
  { value: "IE", label: "Ireland" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "JM", label: "Jamaica" },
  { value: "JP", label: "Japan" },
  { value: "JO", label: "Jordan" },
  { value: "KZ", label: "Kazakhstan" },
  { value: "KE", label: "Kenya" },
  { value: "KI", label: "Kiribati" },
  { value: "KP", label: "North Korea" },
  { value: "KR", label: "South Korea" },
  { value: "KW", label: "Kuwait" },
  { value: "KG", label: "Kyrgyzstan" },
  { value: "LA", label: "Laos" },
  { value: "LV", label: "Latvia" },
  { value: "LB", label: "Lebanon" },
  { value: "LS", label: "Lesotho" },
  { value: "LR", label: "Liberia" },
  { value: "LY", label: "Libya" },
  { value: "LI", label: "Liechtenstein" },
  { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" },
  { value: "MO", label: "Macau" },
  { value: "MG", label: "Madagascar" },
  { value: "MW", label: "Malawi" },
  { value: "MY", label: "Malaysia" },
  { value: "MV", label: "Maldives" },
  { value: "ML", label: "Mali" },
  { value: "MT", label: "Malta" },
  { value: "MH", label: "Marshall Islands" },
  { value: "MR", label: "Mauritania" },
  { value: "MU", label: "Mauritius" },
  { value: "MX", label: "Mexico" },
  { value: "FM", label: "Micronesia" },
  { value: "MD", label: "Moldova" },
  { value: "MC", label: "Monaco" },
  { value: "MN", label: "Mongolia" },
  { value: "ME", label: "Montenegro" },
  { value: "MA", label: "Morocco" },
  { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar" },
  { value: "NA", label: "Namibia" },
  { value: "NR", label: "Nauru" },
  { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands" },
  { value: "NZ", label: "New Zealand" },
  { value: "NI", label: "Nicaragua" },
  { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" },
  { value: "MK", label: "North Macedonia" },
  { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" },
  { value: "PK", label: "Pakistan" },
  { value: "PW", label: "Palau" },
  { value: "PS", label: "Palestine" },
  { value: "PA", label: "Panama" },
  { value: "PG", label: "Papua New Guinea" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "PR", label: "Puerto Rico" },
  { value: "QA", label: "Qatar" },
  { value: "RO", label: "Romania" },
  { value: "RU", label: "Russia" },
  { value: "RW", label: "Rwanda" },
  { value: "KN", label: "Saint Kitts and Nevis" },
  { value: "LC", label: "Saint Lucia" },
  { value: "VC", label: "Saint Vincent and the Grenadines" },
  { value: "WS", label: "Samoa" },
  { value: "SM", label: "San Marino" },
  { value: "ST", label: "Sao Tome and Principe" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "SN", label: "Senegal" },
  { value: "RS", label: "Serbia" },
  { value: "SC", label: "Seychelles" },
  { value: "SL", label: "Sierra Leone" },
  { value: "SG", label: "Singapore" },
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "SB", label: "Solomon Islands" },
  { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" },
  { value: "SS", label: "South Sudan" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "SD", label: "Sudan" },
  { value: "SR", label: "Suriname" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "SY", label: "Syria" },
  { value: "TW", label: "Taiwan" },
  { value: "TJ", label: "Tajikistan" },
  { value: "TZ", label: "Tanzania" },
  { value: "TH", label: "Thailand" },
  { value: "TL", label: "Timor-Leste" },
  { value: "TG", label: "Togo" },
  { value: "TO", label: "Tonga" },
  { value: "TT", label: "Trinidad and Tobago" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Turkey" },
  { value: "TM", label: "Turkmenistan" },
  { value: "TV", label: "Tuvalu" },
  { value: "UG", label: "Uganda" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistan" },
  { value: "VU", label: "Vanuatu" },
  { value: "VA", label: "Vatican City" },
  { value: "VE", label: "Venezuela" },
  { value: "VN", label: "Vietnam" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" },
  { value: "OTHER", label: "Other" },
];

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits.replace(/(\d{0,3})/, "($1");
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d{0,3})/, "($1) $2");
  return digits.replace(/(\d{3})(\d{3})(\d{0,4})/, "($1) $2-$3");
}

interface ProfileModalProps {
  userEmail: string;
  onComplete: () => void;
}

export default function ProfileModal({ userEmail, onComplete }: ProfileModalProps) {
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    church_name: "",
    church_title: "",
    church_city: "",
    church_state: "",
    country: "US",
  });
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const countryRef = useRef<HTMLDivElement>(null);
  const [stateOpen, setStateOpen] = useState(false);
  const [stateQuery, setStateQuery] = useState("");
  const stateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    if (visible) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [visible]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (countryRef.current && !countryRef.current.contains(target)) setCountryOpen(false);
      if (stateRef.current && !stateRef.current.contains(target)) setStateOpen(false);
    }
    if (countryOpen || stateOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [countryOpen, stateOpen]);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "same-origin" });
        const data = await res.json().catch(() => ({}));
        if (mounted && !data.complete && data.profile) {
          const rawPhone = (data.profile.phone ?? "").toString();
          const state = (data.profile.church_state ?? "").toString().trim();
          const rawCountry = (data.profile as { country?: string }).country ?? "";
          const hasCountry = rawCountry.trim().length > 0;
          const looksLikeUSState = state.length === 2 && US_STATES.some((s) => s.value === state);
          const country = hasCountry ? rawCountry.trim() : looksLikeUSState ? "US" : "US";
          setForm({
            first_name: data.profile.first_name ?? "",
            last_name: data.profile.last_name ?? "",
            phone: rawPhone ? formatPhone(rawPhone) : "",
            church_name: data.profile.church_name ?? "",
            church_title: data.profile.church_title ?? "",
            church_city: data.profile.church_city ?? "",
            church_state: state,
            country,
          });
        }
        if (mounted && !data.complete) {
          setNeedsProfile(true);
          setVisible(true);
        }
      } catch {
        if (mounted) setVisible(false);
      }
    }, 4000);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [userEmail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setVisible(false);
        onComplete();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!needsProfile || !visible) return null;

  const ReqLabel = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <label htmlFor={id} className="block text-sm font-medium text-onehope-black">
      {children} <span className="text-red-600" aria-hidden>*</span>
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4"
      onClick={() => setVisible(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col animate-slide-up overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[85vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-onehope-gray px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="profile-modal-title" className="text-lg font-bold text-onehope-black sm:text-xl">
            Complete your profile
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Help us personalize your experience with a few quick questions.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto space-y-4 p-4 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <ReqLabel id="first_name">First Name</ReqLabel>
              <input
                id="first_name"
                type="text"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <ReqLabel id="last_name">Last Name</ReqLabel>
              <input
                id="last_name"
                type="text"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <ReqLabel id="phone">Phone Number</ReqLabel>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
              placeholder="(555) 123-4567"
              required
              className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <ReqLabel id="church_name">Church Name</ReqLabel>
            <input
              id="church_name"
              type="text"
              value={form.church_name}
              onChange={(e) => setForm((f) => ({ ...f, church_name: e.target.value }))}
              required
              className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <ReqLabel id="church_title">Title / Position</ReqLabel>
            <input
              id="church_title"
              type="text"
              value={form.church_title}
              onChange={(e) => setForm((f) => ({ ...f, church_title: e.target.value }))}
              placeholder="e.g. Pastor, Worship Leader, Youth Director"
              required
              className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div ref={countryRef} className="relative">
            <ReqLabel id="country">Country</ReqLabel>
            <input
              id="country"
              type="text"
              autoComplete="off"
              value={countryOpen ? countryQuery : COUNTRIES.find((c) => c.value === form.country)?.label ?? form.country}
              onChange={(e) => {
                setCountryQuery(e.target.value);
                setCountryOpen(true);
              }}
              onFocus={() => {
                setCountryQuery("");
                setCountryOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setCountryOpen(false);
                  setCountryQuery("");
                }
              }}
              required
              className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {countryOpen && (
              <ul
                className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-onehope-gray bg-white py-1 shadow-lg"
                role="listbox"
              >
                {COUNTRIES.filter((c) =>
                  c.label.toLowerCase().includes(countryQuery.toLowerCase())
                ).map((c) => (
                  <li
                    key={c.value}
                    role="option"
                    aria-selected={form.country === c.value}
                    onClick={() => {
                      setForm((f) => ({ ...f, country: c.value, church_state: "" }));
                      setCountryOpen(false);
                      setCountryQuery("");
                    }}
                    className="cursor-pointer px-3 py-2 text-onehope-black hover:bg-onehope-info/50 data-[selected]:bg-onehope-info/30"
                    data-selected={form.country === c.value ? "" : undefined}
                  >
                    {c.label}
                  </li>
                ))}
                {COUNTRIES.filter((c) =>
                  c.label.toLowerCase().includes(countryQuery.toLowerCase())
                ).length === 0 && (
                  <li className="px-3 py-2 text-gray-500">No matching country</li>
                )}
              </ul>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <ReqLabel id="church_city">Church City</ReqLabel>
              <input
                id="church_city"
                type="text"
                value={form.church_city}
                onChange={(e) => setForm((f) => ({ ...f, church_city: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              {form.country === "US" ? (
                <div ref={stateRef} className="relative">
                  <ReqLabel id="church_state">Church State</ReqLabel>
                  <input
                    id="church_state"
                    type="text"
                    autoComplete="off"
                    value={
                      stateOpen
                        ? stateQuery
                        : US_STATES.find((s) => s.value === form.church_state)?.label ?? form.church_state
                    }
                    onChange={(e) => {
                      setStateQuery(e.target.value);
                      setStateOpen(true);
                    }}
                    onFocus={() => {
                      setStateQuery("");
                      setStateOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setStateOpen(false);
                        setStateQuery("");
                      }
                    }}
                    required
                    placeholder="Type to search..."
                    className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {stateOpen && (
                    <ul
                      className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-onehope-gray bg-white py-1 shadow-lg"
                      role="listbox"
                    >
                      {US_STATES.filter(
                        (s) =>
                          s.value &&
                          s.label.toLowerCase().includes(stateQuery.toLowerCase())
                      ).map((s) => (
                        <li
                          key={s.value}
                          role="option"
                          aria-selected={form.church_state === s.value}
                          onClick={() => {
                            setForm((f) => ({ ...f, church_state: s.value }));
                            setStateOpen(false);
                            setStateQuery("");
                          }}
                          className="cursor-pointer px-3 py-2 text-onehope-black hover:bg-onehope-info/50"
                        >
                          {s.label}
                        </li>
                      ))}
                      {US_STATES.filter(
                        (s) =>
                          s.value &&
                          s.label.toLowerCase().includes(stateQuery.toLowerCase())
                      ).length === 0 && (
                        <li className="px-3 py-2 text-gray-500">No matching state</li>
                      )}
                    </ul>
                  )}
                </div>
              ) : (
                <>
                  <ReqLabel id="church_state">State / Province / Region</ReqLabel>
                  <input
                    id="church_state"
                    type="text"
                    value={form.church_state}
                    onChange={(e) => setForm((f) => ({ ...f, church_state: e.target.value }))}
                    placeholder="e.g. Ontario, England, Queensland"
                    required
                    className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="rounded-lg border border-onehope-gray px-4 py-2 text-sm font-medium text-onehope-black hover:bg-onehope-gray/30"
            >
              Later
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

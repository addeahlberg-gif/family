import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, ExternalLink, Plus, Trash2, Users, X } from "lucide-react";

const CACHE_KEY = "familjeplaneraren-d1-cache-v1";
const days = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
const colors = ["#16a34a", "#2563eb", "#db2777", "#ea580c", "#7c3aed", "#0891b2", "#dc2626", "#ca8a04"];
const initialMembers = [
  { id: "a", name: "Andreas", color: colors[0] },
  { id: "w", name: "Wilma", color: colors[2] },
  { id: "o", name: "Olle", color: colors[3] }
];
const initialMeals = days.map(day => ({ day, dish: "", url: "" }));
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const add = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const monday = d => { const x = new Date(d); const n = x.getDay() || 7; x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - n + 1); return x; };
const formatDate = value => new Date(`${value}T12:00:00`).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });

export default function App() {
  const [week, setWeek] = useState(monday(new Date()));
  const [members, setMembers] = useState(initialMembers);
  const [acts, setActs] = useState([]);
  const [meals, setMeals] = useState(initialMeals);
  const [modal, setModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [mealEdit, setMealEdit] = useState(null);
  const [newName, setNewName] = useState("");
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState("Laddar från D1...");
  const saveTimer = useRef(null);
  const weekDays = useMemo(() => days.map((_, i) => add(week, i)), [week]);
  const empty = (date = iso(weekDays[0])) => ({ id: null, title: "", members: members[0] ? [members[0].id] : [], date, endDate: date, start: "17:00", end: "18:00", place: "" });
  const [draft, setDraft] = useState(() => empty());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (!response.ok) throw new Error("API svarade inte korrekt");
        const result = await response.json();
        if (active && result.data) {
          setMembers(result.data.members || initialMembers);
          setActs((result.data.acts || []).map(a => ({ ...a, endDate: a.endDate || a.date })));
          setMeals(result.data.meals || initialMeals);
        }
        if (active) setSaveState("Synkroniserad med D1");
      } catch {
        try {
          const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
          if (active && cached) {
            setMembers(cached.members || initialMembers);
            setActs((cached.acts || []).map(a => ({ ...a, endDate: a.endDate || a.date })));
            setMeals(cached.meals || initialMeals);
          }
        } catch {}
        if (active) setSaveState("Offline, sparar lokalt");
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const payload = { members, acts, meals };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    clearTimeout(saveTimer.current);
    setSaveState("Sparar...");
    saveTimer.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/state", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Sparningen misslyckades");
        setSaveState("Synkroniserad med D1");
      } catch {
        setSaveState("Offline, sparat lokalt");
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [ready, members, acts, meals]);

  const occurs = (a, date) => a.date <= date && (a.endDate || a.date) >= date;
  const openNew = date => { setDraft(empty(date)); setModal(true); };
  const openEdit = a => { setDraft({ ...a, endDate: a.endDate || a.date, members: [...a.members] }); setModal(true); };
  const toggle = id => setDraft(d => ({ ...d, members: d.members.includes(id) ? d.members.filter(x => x !== id) : [...d.members, id] }));
  const save = () => {
    if (!draft.title.trim() || !draft.members.length || draft.endDate < draft.date) return;
    setActs(v => draft.id ? v.map(a => a.id === draft.id ? draft : a) : [...v, { ...draft, id: crypto.randomUUID() }]);
    setModal(false);
  };
  const copy = () => {
    const copied = { ...draft, id: crypto.randomUUID(), title: `Kopia av ${draft.title}`, members: [...draft.members] };
    setActs(v => [...v, copied]);
    setModal(false);
  };
  const del = () => { setActs(v => v.filter(a => a.id !== draft.id)); setModal(false); };
  const addMember = () => {
    if (!newName.trim()) return;
    setMembers(v => [...v, { id: crypto.randomUUID(), name: newName.trim(), color: colors[v.length % colors.length] }]);
    setNewName("");
  };
  const removeMember = id => {
    setMembers(v => v.filter(m => m.id !== id));
    setActs(v => v.map(a => ({ ...a, members: a.members.filter(x => x !== id) })).filter(a => a.members.length));
  };

  return <>
    <header className="header"><div><b>FAMILJENS GEMENSAMMA YTA</b><h1>Familjeplaneraren</h1></div><span className="sync">{saveState}</span></header>
    <main className="wrap">
      <div className="toolbar">
        <div className="row">
          <button className="btn icon" onClick={() => setWeek(add(week, -7))}><ChevronLeft /></button>
          <button className="btn" onClick={() => setWeek(monday(new Date()))}>{iso(weekDays[0])} till {iso(weekDays[6])}</button>
          <button className="btn icon" onClick={() => setWeek(add(week, 7))}><ChevronRight /></button>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setMemberModal(true)}><Users size={17} /> Familjemedlemmar</button>
          <button className="btn primary" onClick={() => openNew(iso(weekDays[0]))}><Plus size={17} /> Aktivitet</button>
        </div>
      </div>
      <div className="layout">
        <section className="card timeline"><div className="grid">
          <div className="gridrow head"><div className="name">Familjemedlem</div>{weekDays.map((d, i) => <div className="cell" key={i}><b>{days[i]}</b><br />{d.getDate()}</div>)}</div>
          {members.map(m => <div className="gridrow" key={m.id}><div className="name"><i className="dot" style={{ background: m.color }} />{m.name}</div>{weekDays.map(d => <div className="cell" key={iso(d)} onDoubleClick={() => openNew(iso(d))}>{acts.filter(a => a.members.includes(m.id) && occurs(a, iso(d))).map(a => <div className="activity" style={{ background: m.color }} key={a.id} onClick={() => openEdit(a)} title={`${a.title}\n${formatDate(a.date)}${a.endDate !== a.date ? ` till ${formatDate(a.endDate)}` : ""}\n${a.start}-${a.end}${a.place ? `\n${a.place}` : ""}`}><b>{a.title}</b><small>{a.start}-{a.end}</small></div>)}</div>)}</div>)}
        </div></section>
        <aside className="card meals"><h3>Veckans mat</h3>{meals.map((m, i) => <div className="meal" key={m.day}><b>{m.day}</b><button onClick={() => setMealEdit(i)}>{m.dish || "Ingen maträtt"}</button>{m.url && <a href={m.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>}</div>)}</aside>
      </div>
    </main>

    {modal && <div className="modalback" onMouseDown={() => setModal(false)}><div className="modal" onMouseDown={e => e.stopPropagation()}><button className="btn close" onClick={() => setModal(false)}><X /></button><h2>{draft.id ? "Redigera aktivitet" : "Ny aktivitet"}</h2><label className="field">Aktivitet<input autoFocus value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label><b>Familjemedlemmar</b><div className="members">{members.map(m => <label className={`check ${draft.members.includes(m.id) ? "selected" : ""}`} key={m.id}><input type="checkbox" checked={draft.members.includes(m.id)} onChange={() => toggle(m.id)} /> {m.name}</label>)}</div><div className="two"><label className="field">Från datum<input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value, endDate: draft.endDate < e.target.value ? e.target.value : draft.endDate })} /></label><label className="field">Till datum<input type="date" min={draft.date} value={draft.endDate} onChange={e => setDraft({ ...draft, endDate: e.target.value })} /></label></div><div className="two"><label className="field">Starttid<input type="time" value={draft.start} onChange={e => setDraft({ ...draft, start: e.target.value })} /></label><label className="field">Sluttid<input type="time" value={draft.end} onChange={e => setDraft({ ...draft, end: e.target.value })} /></label></div><label className="field">Plats<input value={draft.place} onChange={e => setDraft({ ...draft, place: e.target.value })} /></label><div className="modal-actions">{draft.id && <><button className="btn blue" onClick={copy}><Copy size={17} /> Kopiera</button><button className="btn danger icon" onClick={del}><Trash2 /></button></>}<button className="btn primary grow" onClick={save}>Spara</button></div></div></div>}

    {mealEdit !== null && <div className="modalback" onMouseDown={() => setMealEdit(null)}><div className="modal small" onMouseDown={e => e.stopPropagation()}><button className="btn close" onClick={() => setMealEdit(null)}><X /></button><h2>Redigera {meals[mealEdit].day}</h2><label className="field">Maträtt<input autoFocus value={meals[mealEdit].dish} onChange={e => setMeals(v => v.map((m, i) => i === mealEdit ? { ...m, dish: e.target.value } : m))} /></label><label className="field">Receptlänk<input value={meals[mealEdit].url} onChange={e => setMeals(v => v.map((m, i) => i === mealEdit ? { ...m, url: e.target.value } : m))} /></label><button className="btn primary full" onClick={() => setMealEdit(null)}>Spara</button></div></div>}

    {memberModal && <div className="modalback" onMouseDown={() => setMemberModal(false)}><div className="modal small" onMouseDown={e => e.stopPropagation()}><button className="btn close" onClick={() => setMemberModal(false)}><X /></button><h2>Familjemedlemmar</h2><div className="row"><input className="member-input" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addMember()} placeholder="Namn" /><button className="btn primary icon" onClick={addMember}><Plus /></button></div>{members.map(m => <div className="member-line" key={m.id}><span><i className="dot" style={{ background: m.color }} /><b>{m.name}</b></span><button className="btn danger icon" onClick={() => removeMember(m.id)}><Trash2 size={16} /></button></div>)}</div></div>}
  </>;
}

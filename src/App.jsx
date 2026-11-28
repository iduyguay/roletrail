import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { initialJobs, stages } from "./data/jobs.js";
import { initialProfile, readDemoProfile } from "./data/profile.js";
import { analyzeJob } from "./lib/matchScore.js";
import { firebaseConfigured } from "./firebase.js";

const AuthScreen = lazy(() => import("./AuthScreen.jsx"));

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const paths = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    bookmark: (
      <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.6L6 21V4.75Z" />
    ),
    chart: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 3.5-4 3 2.5L19 7" />
        <path d="M15.5 7H19v3.5" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2A1.7 1.7 0 0 0 7.8 17l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2A1.7 1.7 0 0 0 5.4 6.8l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a1.7 1.7 0 0 1 3.4 0v.2A1.7 1.7 0 0 0 17 4.4l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.3 1.9Z" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    dots: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    close: (
      <>
        <path d="m18 6-12 12" />
        <path d="m6 6 12 12" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    external: (
      <>
        <path d="M14 4h6v6" />
        <path d="m20 4-9 9" />
        <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function formatToday() {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function formatDate(value) {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function followUpLabel(value, today) {
  if (value < today) return "Overdue";
  if (value === today) return "Today";
  const tomorrow = new Date(`${today}T12:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (value === localDateKey(tomorrow)) return "Tomorrow";
  return formatDate(value);
}

function readDemoJobs() {
  try {
    const saved = localStorage.getItem("roletrail-demo-jobs");
    return saved ? JSON.parse(saved) : initialJobs;
  } catch {
    return initialJobs;
  }
}

function saveDemoValue(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function JobDialog({ job, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    company: job?.company || "",
    role: job?.role || "",
    location: job?.location || "",
    salary: job?.salary || "",
    stage: job?.stage || "Saved",
    url: job?.url || "",
    description: job?.description || "",
    followUp: /^\d{4}-\d{2}-\d{2}$/.test(job?.followUp || "")
      ? job.followUp
      : "",
  }));
  const [error, setError] = useState("");

  function update(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      setError("Add a company and role before saving.");
      return;
    }
    try {
      await onSave(form);
    } catch {
      return;
    }
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">
              {job ? "A detail worth keeping" : "A new possibility"}
            </span>
            <h2 id="dialog-title">{job ? "Edit this role" : "Save a role"}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="dialog-intro">
          Keep the useful details close. You can add notes and a follow-up
          later.
        </p>
        <form className="job-form" onSubmit={submit}>
          <label>
            Role title
            <input
              name="role"
              value={form.role}
              onChange={update}
              placeholder="Product Designer"
              autoFocus
            />
          </label>
          <label>
            Company
            <input
              name="company"
              value={form.company}
              onChange={update}
              placeholder="Company name"
            />
          </label>
          <div className="form-row">
            <label>
              Location
              <input
                name="location"
                value={form.location}
                onChange={update}
                placeholder="Remote · Europe"
              />
            </label>
            <label>
              Salary range
              <input
                name="salary"
                value={form.salary}
                onChange={update}
                placeholder="€70k–€90k"
              />
            </label>
          </div>
          <label className="description-label">
            Job description
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              rows="5"
              placeholder="Paste the role description here to see how it overlaps with your skills."
            />
            <span className="field-hint">
              Roletrail checks the words in this text against your saved skills.
            </span>
          </label>
          <label>
            Job link
            <input
              name="url"
              value={form.url}
              onChange={update}
              placeholder="https://"
              inputMode="url"
            />
          </label>
          <label>
            Follow-up date
            <input
              name="followUp"
              value={form.followUp}
              onChange={update}
              type="date"
            />
          </label>
          <label>
            Current stage
            <select name="stage" value={form.stage} onChange={update}>
              <option>Saved</option>
              <option>Applied</option>
              <option>Interview</option>
              <option>Offer</option>
              <option>Closed</option>
            </select>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              className="button button-quiet"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button button-primary" type="submit">
              {job ? "Update role" : "Save role"}{" "}
              <Icon name="arrow" size={16} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProfileDialog({ skills, onClose, onSave }) {
  const [items, setItems] = useState(skills);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function addSkill(event) {
    event.preventDefault();
    const skill = value.trim();
    if (!skill) return;
    if (items.some((item) => item.toLowerCase() === skill.toLowerCase())) {
      setError("That skill is already on your list.");
      return;
    }
    if (items.length >= 30) {
      setError("Keep your profile to 30 skills or fewer.");
      return;
    }
    setItems((current) => [...current, skill]);
    setValue("");
    setError("");
  }

  async function save() {
    if (!items.length) {
      setError("Add at least one skill to calculate a match.");
      return;
    }
    try {
      await onSave(items);
    } catch {
      return;
    }
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="dialog profile-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">The match is yours to shape</span>
            <h2 id="profile-title">Your skills</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="dialog-intro">
          Roletrail compares these terms with each saved role description. Add
          the skills you want to look for.
        </p>
        <form className="skill-entry" onSubmit={addSkill}>
          <label className="visually-hidden" htmlFor="new-skill">
            Add a skill
          </label>
          <input
            id="new-skill"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Add a skill, e.g. User research"
          />
          <button className="button button-quiet" type="submit">
            <Icon name="plus" size={15} /> Add
          </button>
        </form>
        <div className="skill-chip-list" aria-label="Your skills">
          {items.map((skill) => (
            <span className="skill-chip" key={skill}>
              {skill}
              <button
                type="button"
                onClick={() =>
                  setItems((current) =>
                    current.filter((item) => item !== skill),
                  )
                }
                aria-label={`Remove ${skill}`}
              >
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <p className="field-hint">
          Up to 30 skills · Match scores update when your profile changes.
        </p>
        <div className="dialog-actions">
          <button
            className="button button-quiet"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            type="button"
            onClick={save}
          >
            Save skills <Icon name="arrow" size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

function MatchDialog({ job, skills, onClose }) {
  const analysis = analyzeJob(`${job.role} ${job.description || ""}`, skills);
  const level =
    analysis.score >= 80
      ? "Strong overlap"
      : analysis.score >= 50
        ? "Some overlap"
        : "A stretch";

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="dialog match-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-title"
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">A closer look · {job.company}</span>
            <h2 id="match-title">How this role lines up</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="match-overview">
          <div
            className="analysis-score"
            style={{ "--progress": `${analysis.score * 3.6}deg` }}
          >
            <div>
              <strong>{analysis.score}</strong>
              <span>%</span>
            </div>
          </div>
          <div>
            <span className="eyebrow">Skill overlap</span>
            <h3>{level}</h3>
            <p>
              {analysis.matchedSkills.length} of {skills.length} skills appear
              in the saved role text.
            </p>
          </div>
        </div>
        <div className="skill-breakdown">
          <section>
            <h3>
              <span className="breakdown-dot found" />
              Found in the description{" "}
              <span>{analysis.matchedSkills.length}</span>
            </h3>
            {analysis.matchedSkills.length ? (
              <div className="skill-chip-list">
                {analysis.matchedSkills.map((skill) => (
                  <span className="skill-chip found-chip" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="breakdown-empty">
                No saved skills found in this text yet.
              </p>
            )}
          </section>
          <section>
            <h3>
              <span className="breakdown-dot missing" />
              Not mentioned <span>{analysis.missingSkills.length}</span>
            </h3>
            {analysis.missingSkills.length ? (
              <div className="skill-chip-list">
                {analysis.missingSkills.map((skill) => (
                  <span className="skill-chip muted-chip" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="breakdown-empty">
                Every saved skill appears in the description.
              </p>
            )}
          </section>
        </div>
        <p className="match-method">
          This is a phrase overlap check on the text you saved, not a prediction
          of hiring outcomes. Review the role yourself before applying.
        </p>
        {job.description && (
          <details className="saved-description">
            <summary>View saved description</summary>
            <p>{job.description}</p>
          </details>
        )}
        {job.url && (
          <a
            className="job-source-link"
            href={job.url}
            target="_blank"
            rel="noreferrer"
          >
            Open original listing <Icon name="external" size={14} />
          </a>
        )}
      </section>
    </div>
  );
}

function InsightsPanel({
  jobs,
  counts,
  averageMatch,
  topRole,
  today,
  upcomingFollowUps,
  onOpenNote,
}) {
  const stagesInOrder = ["Saved", "Applied", "Interview", "Offer", "Closed"];
  const largestStage = Math.max(
    1,
    ...stagesInOrder.map((stage) => counts[stage] || 0),
  );

  return (
    <section className="insights-panel" aria-labelledby="insights-title">
      <div className="insights-heading">
        <div>
          <h2 id="insights-title">Application insights</h2>
        </div>
        <span className="insights-total">{jobs.length} roles saved</span>
      </div>
      <div className="insights-grid">
        <article className="insight-card insight-average">
          <span className="insight-label">Average skill overlap</span>
          <strong>
            {averageMatch}
            <small>%</small>
          </strong>
          <p>Across descriptions you’ve saved.</p>
        </article>
        <article className="insight-card insight-top">
          <span className="insight-label">Closest match</span>
          {topRole ? (
            <>
              <strong>{topRole.company}</strong>
              <p>
                {topRole.role} <span>·</span> {topRole.match}% overlap
              </p>
            </>
          ) : (
            <p>Add a role description to start comparing.</p>
          )}
        </article>
        <article className="insight-card insight-pipeline">
          <span className="insight-label">Your pipeline</span>
          <div className="pipeline-bars">
            {stagesInOrder.map((stage) => (
              <div className="pipeline-bar-row" key={stage}>
                <span>{stage}</span>
                <div>
                  <i
                    style={{
                      width: `${((counts[stage] || 0) / largestStage) * 100}%`,
                    }}
                  />
                </div>
                <strong>{counts[stage] || 0}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
      <section className="follow-up-panel" aria-labelledby="follow-up-title">
        <div className="follow-up-heading">
          <div>
            <span className="insight-label">A gentle nudge</span>
            <h3 id="follow-up-title">Coming up next</h3>
          </div>
          <span className="insights-total">Next 7 days</span>
        </div>
        {upcomingFollowUps.length ? (
          <ul className="follow-up-list">
            {upcomingFollowUps.map((job) => (
              <li key={job.id}>
                <button type="button" onClick={() => onOpenNote(job)}>
                  <span className="follow-up-company">{job.company}</span>
                  <span className="follow-up-role">{job.role}</span>
                  <span
                    className={`follow-up-date ${job.followUp < today ? "overdue" : ""}`}
                  >
                    {followUpLabel(job.followUp, today)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="follow-up-empty">
            Nothing due this week. Add a follow-up when you’re ready.
          </p>
        )}
      </section>
      <p className="insight-footnote">
        Match scores compare saved profile skills with words in each role
        description. They describe text overlap only.
      </p>
    </section>
  );
}

function StageBadge({ stage }) {
  return (
    <span className={`stage-badge stage-${stage.toLowerCase()}`}>
      <span />
      {stage}
    </span>
  );
}

function JobRow({
  job,
  analysis,
  onStageChange,
  onToggleNote,
  onEdit,
  onRemove,
  onViewMatch,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article className="job-row">
      <div className={`company-mark mark-${job.color}`}>{job.initials}</div>
      <div className="job-main">
        <div className="job-title-line">
          <h3>{job.role}</h3>
          <button
            className="match-score"
            type="button"
            onClick={() => onViewMatch(job)}
            aria-label={`View skill match for ${job.role} at ${job.company}`}
          >
            <span>{analysis.score}</span>% match
          </button>
        </div>
        <p className="job-meta">
          <span>{job.company}</span>
          <span className="meta-dot" />
          {job.location}
          <span className="meta-dot" />
          {job.salary || "Salary not listed"}
        </p>
      </div>
      <div className="job-stage">
        <StageBadge stage={job.stage} />
      </div>
      <div className="job-date">
        <span>{job.followUp ? "Next step" : "Added"}</span>
        <strong>{job.followUp ? formatDate(job.followUp) : job.date}</strong>
      </div>
      <div className="row-actions">
        <button
          className={`icon-button ${job.note ? "has-note" : ""}`}
          type="button"
          aria-label={job.note ? "View note" : "Add note"}
          onClick={() => onToggleNote(job)}
        >
          <Icon name="dots" />
        </button>
        <div className="row-menu-wrap">
          <button
            className="icon-button"
            type="button"
            aria-label={`Actions for ${job.role} at ${job.company}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name="chevron" />
          </button>
          {menuOpen && (
            <div className="row-menu">
              <button
                type="button"
                onClick={() => {
                  onEdit(job);
                  setMenuOpen(false);
                }}
              >
                Edit details
              </button>
              <span className="menu-rule" />
              {stages.slice(1).map((stage) => (
                <button
                  type="button"
                  key={stage}
                  onClick={() => {
                    onStageChange(job.id, stage);
                    setMenuOpen(false);
                  }}
                >
                  {stage}
                </button>
              ))}
              <span className="menu-rule" />
              <button
                className="danger-action"
                type="button"
                onClick={() => {
                  onRemove(job);
                  setMenuOpen(false);
                }}
              >
                Remove role
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!firebaseConfigured);
  const [authError, setAuthError] = useState(false);
  const [jobsReady, setJobsReady] = useState(!firebaseConfigured);
  const [jobs, setJobs] = useState(readDemoJobs);
  const [profile, setProfile] = useState(readDemoProfile);
  const [activeStage, setActiveStage] = useState("All roles");
  const [query, setQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [activeNav, setActiveNav] = useState("Overview");
  const [appError, setAppError] = useState("");

  useEffect(() => {
    if (!firebaseConfigured) return undefined;
    let active = true;
    let unsubscribe;
    import("./auth.js")
      .then(({ observeAuth }) => {
        if (!active) return;
        unsubscribe = observeAuth((currentUser) => {
          setUser(currentUser);
          setAuthReady(true);
          setJobsReady(!currentUser);
          if (!currentUser) setJobs([]);
        });
      })
      .catch(() => {
        if (active) setAuthError(true);
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    let unsubscribe;
    setJobsReady(false);
    import("./data/firestore.js")
      .then(({ subscribeToJobs }) => {
        if (!active) return;
        unsubscribe = subscribeToJobs(
          user.uid,
          (records) => {
            setJobs(records);
            setJobsReady(true);
            setAppError("");
          },
          () => {
            setAppError(
              "Your roles could not be loaded. Check the Firestore rules in the project setup.",
            );
            setJobsReady(true);
          },
        );
      })
      .catch(() => {
        setAppError("Firestore could not start. Check the project setup.");
        setJobsReady(true);
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    let unsubscribe;
    import("./data/firestore.js")
      .then(({ subscribeToProfile }) => {
        if (!active) return;
        unsubscribe = subscribeToProfile(
          user.uid,
          (savedProfile) => setProfile(savedProfile),
          () => setAppError("Your skill profile could not be loaded."),
        );
      })
      .catch(() => setAppError("Your skill profile could not be loaded."));
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [user]);

  useEffect(() => {
    if (!firebaseConfigured) saveDemoValue("roletrail-demo-jobs", jobs);
  }, [jobs]);

  useEffect(() => {
    if (!firebaseConfigured) saveDemoValue("roletrail-demo-profile", profile);
  }, [profile]);

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const stageMatches =
          activeStage === "All roles" || job.stage === activeStage;
        const searchText =
          `${job.role} ${job.company} ${job.location}`.toLowerCase();
        return stageMatches && searchText.includes(query.toLowerCase().trim());
      }),
    [jobs, activeStage, query],
  );

  const counts = useMemo(
    () =>
      jobs.reduce((result, job) => {
        result[job.stage] = (result[job.stage] || 0) + 1;
        return result;
      }, {}),
    [jobs],
  );

  const activeCount = jobs.filter((job) =>
    ["Applied", "Interview", "Offer"].includes(job.stage),
  ).length;
  const interviews = counts.Interview || 0;
  const today = localDateKey();
  const followUpHorizon = new Date();
  followUpHorizon.setDate(followUpHorizon.getDate() + 7);
  const lastFollowUpDay = localDateKey(followUpHorizon);
  const upcomingFollowUps = jobs
    .filter(
      (job) =>
        job.stage !== "Closed" &&
        /^\d{4}-\d{2}-\d{2}$/.test(job.followUp || "") &&
        job.followUp <= lastFollowUpDay,
    )
    .sort((first, second) => first.followUp.localeCompare(second.followUp));
  const followUps = upcomingFollowUps.length;
  const jobAnalysis = (job) =>
    analyzeJob(
      `${job.role} ${job.description || ""}`,
      profile.skills || initialProfile.skills,
    );
  const averageMatch = jobs.length
    ? Math.round(
        jobs.reduce((total, job) => total + jobAnalysis(job).score, 0) /
          jobs.length,
      )
    : 0;
  const topRole = jobs.reduce(
    (best, job) =>
      !best || jobAnalysis(job).score > jobAnalysis(best).score
        ? { ...job, match: jobAnalysis(job).score }
        : best,
    null,
  );

  if (authError)
    return (
      <main className="app-loading">
        <div>
          <p role="alert">
            Sign-in could not start. Check your connection and try again.
          </p>
          <button
            className="button button-primary"
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  if (firebaseConfigured && !authReady)
    return <div className="app-loading">Opening your workspace…</div>;
  if (firebaseConfigured && !user)
    return (
      <Suspense
        fallback={<div className="app-loading">Opening your workspace…</div>}
      >
        <AuthScreen />
      </Suspense>
    );
  if (firebaseConfigured && !jobsReady)
    return <div className="app-loading">Loading your roles…</div>;

  async function addJob(form) {
    const company = form.company.trim();
    const initials = company
      .split(/\s+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const today = new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(new Date());
    const description = form.description.trim();
    const record = {
      ...form,
      company,
      role: form.role.trim(),
      description,
      initials,
      color: "peach",
      date: today,
      note: "",
      type: "Full-time",
      url: form.url.trim(),
    };
    try {
      if (user) {
        const { createJob } = await import("./data/firestore.js");
        await createJob(user.uid, record);
      } else {
        setJobs((current) => [
          { ...record, id: crypto.randomUUID() },
          ...current,
        ]);
      }
    } catch {
      setAppError("This role could not be saved. Please try again.");
      throw new Error("Could not save role");
    }
    setActiveStage("All roles");
    setQuery("");
    setShowAddDialog(false);
  }

  async function updateJobDetails(form) {
    const company = form.company.trim();
    const changes = {
      company,
      initials: company
        .split(/\s+/)
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
      role: form.role.trim(),
      location: form.location.trim(),
      salary: form.salary.trim(),
      stage: form.stage,
      url: form.url.trim(),
      description: form.description.trim(),
      followUp: form.followUp,
    };
    try {
      if (user) {
        const { updateJob } = await import("./data/firestore.js");
        await updateJob(user.uid, editingJob.id, changes);
      } else {
        setJobs((current) =>
          current.map((job) =>
            job.id === editingJob.id ? { ...job, ...changes } : job,
          ),
        );
      }
      setEditingJob(null);
    } catch {
      setAppError("This role could not be updated. Please try again.");
      throw new Error("Could not update role");
    }
  }

  async function changeStage(id, stage) {
    if (user) {
      try {
        const { updateJob } = await import("./data/firestore.js");
        await updateJob(user.uid, id, { stage });
      } catch {
        setAppError("The application stage could not be updated.");
      }
      return;
    }
    setJobs((current) =>
      current.map((job) => (job.id === id ? { ...job, stage } : job)),
    );
  }

  function openNote(job) {
    setSelectedNote(job);
  }

  function openAnalysis(job) {
    setSelectedAnalysis(job);
  }

  async function saveProfile(skills) {
    const nextProfile = { skills };
    if (user) {
      try {
        const { saveProfile: saveCloudProfile } =
          await import("./data/firestore.js");
        await saveCloudProfile(user.uid, skills);
      } catch {
        setAppError("Your skills could not be saved.");
        throw new Error("Could not save skills");
      }
    }
    setProfile(nextProfile);
    setShowProfileDialog(false);
  }

  async function saveNote({ note, followUp }) {
    if (user) {
      try {
        const { updateJob } = await import("./data/firestore.js");
        await updateJob(user.uid, selectedNote.id, { note, followUp });
        setSelectedNote(null);
      } catch {
        setAppError("Your note could not be saved.");
      }
      return;
    }
    setJobs((current) =>
      current.map((job) =>
        job.id === selectedNote.id ? { ...job, note, followUp } : job,
      ),
    );
    setSelectedNote(null);
  }

  async function deleteJob(job) {
    if (!window.confirm(`Remove ${job.role} at ${job.company}?`)) return;
    if (user) {
      try {
        const { removeJob } = await import("./data/firestore.js");
        await removeJob(user.uid, job.id);
      } catch {
        setAppError("This role could not be removed.");
      }
      return;
    }
    setJobs((current) => current.filter((entry) => entry.id !== job.id));
  }

  function signOutUser() {
    if (user)
      import("./auth.js")
        .then(({ endSession }) => endSession())
        .catch(() => setAppError("Could not sign out. Try again."));
  }

  function openProfileSettings() {
    setActiveNav("Settings");
    setShowProfileDialog(true);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="#overview" className="brand" aria-label="Roletrail home">
          <BrandMark />
          <span>roletrail</span>
        </a>
        <div className="workspace-switcher">
          <div className="workspace-avatar">R</div>
          <div className="workspace-copy">
            <strong>Personal workspace</strong>
            <span>Job search</span>
          </div>
        </div>
        <div className="sidebar-label">Workspace</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {[
            ["Overview", "grid"],
            ["My roles", "bookmark"],
            ["Insights", "chart"],
          ].map(([label, icon]) => (
            <button
              className={`nav-item ${activeNav === label ? "active" : ""}`}
              type="button"
              key={label}
              onClick={() => setActiveNav(label)}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {label === "My roles" && (
                <span className="nav-count">{jobs.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-label stage-label">Application stages</div>
        <nav className="stage-nav" aria-label="Filter by application stage">
          {stages.slice(1).map((stage) => (
            <button
              className={`stage-filter ${activeStage === stage ? "selected" : ""}`}
              type="button"
              key={stage}
              onClick={() => {
                setActiveStage(stage);
                setActiveNav("My roles");
              }}
            >
              <span className={`stage-dot dot-${stage.toLowerCase()}`} />
              {stage}
              <span className="stage-count">{counts[stage] || 0}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="nav-item settings-link"
            type="button"
            onClick={openProfileSettings}
          >
            <Icon name="settings" />
            <span>Settings</span>
          </button>
          <div className="profile-row">
            <div className="profile-avatar">
              {user
                ? (user.displayName || user.email || "RT")
                    .slice(0, 2)
                    .toUpperCase()
                : "DA"}
            </div>
            <div className="profile-copy">
              <strong>
                {user?.displayName || user?.email || "Duygu Aykaş"}
              </strong>
              <span>{user ? "Your account" : "Demo account"}</span>
            </div>
            <Icon name="dots" size={17} />
          </div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="mobile-brand">
            <BrandMark />
            <span>roletrail</span>
          </div>
          <div className="breadcrumb">
            <span>Workspace</span>
            <Icon name="chevron" size={14} />
            <strong>{activeNav}</strong>
          </div>
          <div className="topbar-right">
            <span className="today-label">{formatToday()}</span>
            {user && (
              <button
                type="button"
                className="signout-button"
                onClick={signOutUser}
              >
                Sign out
              </button>
            )}
            <button
              className="topbar-avatar"
              type="button"
              onClick={openProfileSettings}
              aria-label="Edit your skill profile"
            >
              {user
                ? (user.displayName || user.email || "RT")
                    .slice(0, 2)
                    .toUpperCase()
                : "DA"}
            </button>
          </div>
        </header>
        <div className="page-wrap">
          {!firebaseConfigured && (
            <div className="demo-banner">
              <span className="demo-dot" />
              Demo workspace{" "}
              <span>
                Roles are saved in this browser. Add Firebase settings to enable
                sign-in and cloud sync.
              </span>
            </div>
          )}
          {appError && (
            <div className="app-error" role="alert">
              {appError}
              <button
                type="button"
                onClick={() => setAppError("")}
                aria-label="Dismiss message"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          )}
          <section className="welcome-row">
            <div>
              <p className="eyebrow">{formatToday()}</p>
              <h1>
                Your search,
                <br />
                <em>in motion.</em>
              </h1>
              <p className="welcome-copy">
                A clear view of where things stand — and what to do next.
              </p>
            </div>
            <button
              className="button button-primary add-button"
              type="button"
              onClick={() => setShowAddDialog(true)}
            >
              <Icon name="plus" size={17} /> Add a role
            </button>
          </section>

          <section className="metrics-grid" aria-label="Application overview">
            <article className="metric-card metric-highlight">
              <div className="metric-top">
                <span>Active applications</span>
                <span className="metric-icon">
                  <Icon name="arrow" size={16} />
                </span>
              </div>
              <div className="metric-value">
                {String(activeCount).padStart(2, "0")}
                <span className="metric-unit"> roles</span>
              </div>
              <div className="metric-foot">Moving through the pipeline</div>
              <div className="metric-decoration">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-top">
                <span>In conversation</span>
                <span className="metric-small-icon">
                  <Icon name="chart" size={16} />
                </span>
              </div>
              <div className="metric-value">
                {String(interviews).padStart(2, "0")}
                <span className="metric-unit"> roles</span>
              </div>
              <div className="metric-foot">Across interview stages</div>
              <div className="conversation-line">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-top">
                <span>Follow-ups due</span>
                <span className="metric-small-icon">
                  <Icon name="clock" size={16} />
                </span>
              </div>
              <div className="metric-value">
                {String(followUps).padStart(2, "0")}
                <span className="metric-unit"> reminders</span>
              </div>
              <div className="metric-foot">Due or coming up this week.</div>
              <button
                className="text-button insights-toggle"
                type="button"
                aria-expanded={activeNav === "Insights"}
                onClick={() =>
                  setActiveNav(
                    activeNav === "Insights" ? "Overview" : "Insights",
                  )
                }
              >
                {activeNav === "Insights" ? "Hide insights" : "View insights"}
                <Icon name="arrow" size={14} />
              </button>
            </article>
          </section>

          {activeNav === "Insights" && (
            <InsightsPanel
              jobs={jobs}
              counts={counts}
              averageMatch={averageMatch}
              topRole={topRole}
              today={today}
              upcomingFollowUps={upcomingFollowUps}
              onOpenNote={openNote}
            />
          )}

          <section className="roles-section" aria-labelledby="roles-heading">
            <div className="section-heading">
              <div>
                <div className="eyebrow">The pipeline</div>
                <h2 id="roles-heading">
                  Your roles{" "}
                  <span className="section-count">
                    {String(filteredJobs.length).padStart(2, "0")}
                  </span>
                </h2>
              </div>
              <div className="section-tools">
                <label className="search-box">
                  <Icon name="search" size={17} />
                  <span className="visually-hidden">Search roles</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search roles"
                  />
                </label>
                <button
                  className="filter-button"
                  type="button"
                  aria-label="Show all roles"
                  onClick={() => setActiveStage("All roles")}
                >
                  <span className="filter-lines">
                    <i />
                    <i />
                    <i />
                  </span>{" "}
                  All stages
                </button>
              </div>
            </div>
            <div
              className="stage-tabs"
              role="tablist"
              aria-label="Filter roles by stage"
            >
              {stages.map((stage) => (
                <button
                  className={`stage-tab ${activeStage === stage ? "active" : ""}`}
                  type="button"
                  role="tab"
                  aria-selected={activeStage === stage}
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                >
                  {stage}
                  <span>
                    {stage === "All roles" ? jobs.length : counts[stage] || 0}
                  </span>
                </button>
              ))}
            </div>
            <div className="job-list" aria-live="polite">
              {filteredJobs.length ? (
                filteredJobs.map((job) => (
                  <JobRow
                    job={job}
                    analysis={jobAnalysis(job)}
                    key={job.id}
                    onStageChange={changeStage}
                    onToggleNote={openNote}
                    onEdit={setEditingJob}
                    onRemove={deleteJob}
                    onViewMatch={openAnalysis}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-mark">
                    <Icon name="search" size={22} />
                  </span>
                  <h3>No roles found</h3>
                  <p>Try another search or choose a different stage.</p>
                  <button
                    type="button"
                    className="button button-quiet"
                    onClick={() => {
                      setActiveStage("All roles");
                      setQuery("");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
            <div className="list-footer">
              <span>
                Showing {filteredJobs.length} of {jobs.length} roles
              </span>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setActiveStage("All roles");
                  setActiveNav("My roles");
                }}
              >
                View all roles <Icon name="arrow" size={15} />
              </button>
            </div>
          </section>
        </div>
      </main>

      {showAddDialog && (
        <JobDialog
          job={null}
          onClose={() => setShowAddDialog(false)}
          onSave={addJob}
        />
      )}
      {editingJob && (
        <JobDialog
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSave={updateJobDetails}
        />
      )}
      {showProfileDialog && (
        <ProfileDialog
          skills={profile.skills || initialProfile.skills}
          onClose={() => setShowProfileDialog(false)}
          onSave={saveProfile}
        />
      )}
      {selectedNote && (
        <NoteDialog
          job={selectedNote}
          onClose={() => setSelectedNote(null)}
          onSave={saveNote}
        />
      )}
      {selectedAnalysis && (
        <MatchDialog
          job={selectedAnalysis}
          skills={profile.skills || initialProfile.skills}
          onClose={() => setSelectedAnalysis(null)}
        />
      )}
    </div>
  );
}

function NoteDialog({ job, onClose, onSave }) {
  const [note, setNote] = useState(job.note || "");
  const [followUp, setFollowUp] = useState(
    /^\d{4}-\d{2}-\d{2}$/.test(job.followUp || "") ? job.followUp : "",
  );
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="dialog note-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-title"
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">
              {job.company} · {job.role}
            </span>
            <h2 id="note-title">Keep a note</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
        </div>
        <label className="note-input-label">
          Your private note
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows="5"
            placeholder="A person to follow up with, something to prepare, a thought to revisit…"
          />
        </label>
        <label className="note-input-label followup-field">
          Next follow-up
          <input
            type="date"
            value={followUp}
            onChange={(event) => setFollowUp(event.target.value)}
          />
        </label>
        <div className="dialog-actions">
          <button
            className="button button-quiet"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            type="button"
            onClick={() => onSave({ note, followUp })}
          >
            Save note <Icon name="arrow" size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;

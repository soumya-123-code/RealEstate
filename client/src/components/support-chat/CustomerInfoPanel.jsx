import { useState, useCallback, useMemo } from "react";
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiUser,
  FiHome,
  FiTarget,
  FiUsers,
  FiBookmark,
  FiClock,
  FiCheckCircle,
  FiArchive,
  FiChevronDown,
  FiChevronUp,
  FiMessageSquare,
  FiPlus,
  FiSave,
  FiCalendar,
  FiX,
  FiPhoneOutgoing,
  FiPhoneIncoming,
  FiVideo,
} from "react-icons/fi";

// ── Info card wrapper ────────────────────────────────────────────────────────
function InfoCard({ title, icon: Icon, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="sc-info-card">
      <button
        type="button"
        className="sc-info-card__header"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="sc-info-card__header-left">
          {Icon && <Icon size={14} />}
          <span>{title}</span>
        </div>
        {isOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>
      {isOpen && <div className="sc-info-card__body">{children}</div>}
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon, action, onClick }) {
  return (
    <div className="sc-info-row" onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      {Icon && (
        <span className="sc-info-row__icon">
          <Icon size={13} />
        </span>
      )}
      <div className="sc-info-row__content">
        <span className="sc-info-row__label">{label}</span>
        <span className="sc-info-row__value">{value || "—"}</span>
      </div>
      {action && <span className="sc-info-row__action">{action}</span>}
    </div>
  );
}

// ── Call history item ───────────────────────────────────────────────────────
function CallHistoryItem({ call }) {
  const isOutgoing = call.direction === "outgoing";
  const isMissed = call.status === "missed";

  return (
    <div className={`sc-call-history-item${isMissed ? " sc-call-history-item--missed" : ""}`}>
      <span className="sc-call-history-item__icon">
        {call.type === "video" ? (
          <FiVideo size={13} />
        ) : isOutgoing ? (
          <FiPhoneOutgoing size={13} />
        ) : (
          <FiPhoneIncoming size={13} />
        )}
      </span>
      <div className="sc-call-history-item__info">
        <span className="sc-call-history-item__label">
          {isOutgoing ? "Outgoing" : "Incoming"} {call.type === "video" ? "Video" : "Audio"}
        </span>
        <span className="sc-call-history-item__time">
          {call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, "0")}` : "No answer"}
        </span>
      </div>
      <span className="sc-call-history-item__date">
        {call.createdAt ? new Date(call.createdAt).toLocaleDateString() : ""}
      </span>
    </div>
  );
}

// ── CustomerInfoPanel component ──────────────────────────────────────────────
export default function CustomerInfoPanel({
  activeCustomer,
  activeConversation,
  customerInfo,
  propertyInfo,
  staffList,
  callHistory,
  onAssignStaff,
  onResolveConversation,
  onArchiveConversation,
  onClose,
  showBack,
  onBack,
}) {
  const [selectedStaff, setSelectedStaff] = useState("");
  const [notes, setNotes] = useState(customerInfo?.notes || "");
  const [leadStatus, setLeadStatus] = useState(customerInfo?.leadStatus || "");
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackTime, setCallbackTime] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const leadStatuses = ["New", "Contacted", "Interested", "Qualified", "Negotiation", "Won", "Lost"];

  // ── Handle assign staff ──────────────────────────────────────────────────
  const handleAssign = useCallback(() => {
    if (!selectedStaff || !activeConversation) return;
    onAssignStaff?.(activeConversation.id, selectedStaff);
    setSelectedStaff("");
  }, [selectedStaff, activeConversation, onAssignStaff]);

  // ── Handle save notes ────────────────────────────────────────────────────
  const handleSaveNotes = useCallback(() => {
    setSavingNotes(true);
    // Notes would be saved via API here
    setTimeout(() => {
      setSavingNotes(false);
    }, 500);
  }, []);

  // ── Handle update lead status ────────────────────────────────────────────
  const handleLeadStatusChange = useCallback((status) => {
    setLeadStatus(status);
  }, []);

  // ── Mock call history for display ───────────────────────────────────────
  const mockCallHistory = callHistory || [];

  const assignedStaffName = useMemo(() => {
    if (!activeConversation?.assignedStaffId) return null;
    const staff = staffList.find((s) => s.id === activeConversation.assignedStaffId);
    return staff?.username || "Unknown";
  }, [activeConversation, staffList]);

  return (
    <div className="sc-info-panel">
      {/* Mobile header */}
      {showBack && (
        <div className="sc-info-panel__mobile-header">
          <button type="button" onClick={onBack || onClose} className="sc-info-panel__back-btn">
            ← Back
          </button>
          <span className="sc-info-panel__mobile-title">Details</span>
          <button type="button" onClick={onClose} className="sc-info-panel__close-btn">
            <FiX size={16} />
          </button>
        </div>
      )}

      <div className="sc-info-panel__content">
        {/* Customer info */}
        <InfoCard title="Customer" icon={FiUser} defaultOpen={true}>
          <div className="sc-info-customer">
            <div className="sc-info-customer__avatar">
              {activeCustomer?.avatar ? (
                <img src={activeCustomer.avatar} alt={activeCustomer?.name} />
              ) : (
                <span>{(activeCustomer?.name || "?")[0].toUpperCase()}</span>
              )}
            </div>
            <h3 className="sc-info-customer__name">{activeCustomer?.name || "Unknown"}</h3>
            {activeCustomer?.online && (
              <span className="sc-info-customer__online-badge">● Online</span>
            )}
          </div>
          <div className="sc-info-details">
            <InfoRow
              label="Phone"
              value={activeCustomer?.phone}
              icon={FiPhone}
              action={activeCustomer?.phone ? (
                <a href={`tel:${activeCustomer.phone}`} className="sc-info-link">
                  <FiPhone size={12} />
                </a>
              ) : null}
            />
            <InfoRow
              label="Email"
              value={activeCustomer?.email}
              icon={FiMail}
              action={activeCustomer?.email ? (
                <a href={`mailto:${activeCustomer.email}`} className="sc-info-link">
                  <FiMail size={12} />
                </a>
              ) : null}
            />
            <InfoRow
              label="Location"
              value={customerInfo?.location || customerInfo?.city}
              icon={FiMapPin}
            />
          </div>
        </InfoCard>

        {/* Property info */}
        {propertyInfo && (
          <InfoCard title="Property" icon={FiHome} defaultOpen={true}>
            <div className="sc-info-property">
              {propertyInfo.images?.[0] && (
                <div className="sc-info-property__thumb">
                  <img src={propertyInfo.images[0]} alt={propertyInfo.title || propertyInfo.name} loading="lazy" />
                </div>
              )}
              <div className="sc-info-property__details">
                <InfoRow label="Name" value={propertyInfo.title || propertyInfo.name} icon={FiHome} />
                <InfoRow label="ID" value={propertyInfo.id?.toString()} icon={FiBookmark} />
                {propertyInfo.price && (
                  <InfoRow label="Price" value={`₹${propertyInfo.price.toLocaleString()}`} icon={FiTarget} />
                )}
                {propertyInfo.type && (
                  <InfoRow label="Type" value={propertyInfo.type} icon={FiHome} />
                )}
                {propertyInfo.status && (
                  <InfoRow label="Status" value={propertyInfo.status} icon={FiCheckCircle} />
                )}
              </div>
            </div>
          </InfoCard>
        )}

        {/* Lead info */}
        <InfoCard title="Lead" icon={FiTarget} defaultOpen={false}>
          <div className="sc-info-lead">
            <div className="sc-info-lead__row">
              <label>Status</label>
              <select
                value={leadStatus}
                onChange={(e) => handleLeadStatusChange(e.target.value)}
                className="sc-info-lead__select"
              >
                {leadStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <InfoRow
              label="Source"
              value={customerInfo?.leadSource || "Direct"}
              icon={FiMessageSquare}
            />
            <InfoRow
              label="Assigned To"
              value={assignedStaffName || "Unassigned"}
              icon={FiUsers}
            />
          </div>
        </InfoCard>

        {/* Actions */}
        <InfoCard title="Actions" icon={FiBookmark} defaultOpen={true}>
          <div className="sc-info-actions">
            {/* Assign staff */}
            <div className="sc-info-actions__row">
              <label>Assign Staff</label>
              <div className="sc-info-actions__assign">
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="sc-info-actions__select"
                >
                  <option value="">Select staff...</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.username}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="sc-info-actions__btn sc-info-actions__btn--primary"
                  onClick={handleAssign}
                  disabled={!selectedStaff}
                >
                  Assign
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="sc-info-actions__row">
              <label>Notes</label>
              <textarea
                className="sc-info-actions__textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this customer..."
                rows={3}
              />
              <button
                type="button"
                className="sc-info-actions__btn sc-info-actions__btn--secondary"
                onClick={handleSaveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>

            {/* Schedule callback */}
            <div className="sc-info-actions__row">
              <label>Schedule Callback</label>
              <div className="sc-info-actions__callback">
                <input
                  type="date"
                  className="sc-info-actions__date"
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                <input
                  type="time"
                  className="sc-info-actions__time"
                  value={callbackTime}
                  onChange={(e) => setCallbackTime(e.target.value)}
                />
                <button
                  type="button"
                  className="sc-info-actions__btn sc-info-actions__btn--secondary"
                  disabled={!callbackDate || !callbackTime}
                >
                  <FiCalendar size={12} /> Schedule
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="sc-info-actions__quick">
              <button
                type="button"
                className="sc-info-actions__quick-btn sc-info-actions__quick-btn--resolve"
                onClick={() => activeConversation && onResolveConversation?.(activeConversation.id)}
              >
                <FiCheckCircle size={14} />
                Mark Resolved
              </button>
              <button
                type="button"
                className="sc-info-actions__quick-btn sc-info-actions__quick-btn--archive"
                onClick={() => activeConversation && onArchiveConversation?.(activeConversation.id)}
              >
                <FiArchive size={14} />
                Archive
              </button>
            </div>
          </div>
        </InfoCard>

        {/* Call history */}
        {mockCallHistory.length > 0 && (
          <InfoCard title="Call History" icon={FiPhone} defaultOpen={false}>
            <div className="sc-info-call-history">
              {mockCallHistory.map((call, idx) => (
                <CallHistoryItem key={call.id || idx} call={call} />
              ))}
            </div>
          </InfoCard>
        )}
      </div>
    </div>
  );
}

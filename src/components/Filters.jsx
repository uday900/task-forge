function Filters({ filters, onFilterChange, teamOptions, listOptions }) {
  return (
    <section className="filters" aria-label="Filters">
      <label>
        Assignee
        <select
          value={filters.assignee}
          onChange={(event) => onFilterChange('assignee', event.target.value)}
          id="assigneeFilter"
        >
          {teamOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Priority
        <select
          value={filters.priority}
          onChange={(event) => onFilterChange('priority', event.target.value)}
          id="priorityFilter"
        >
          <option value="">Any priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </label>
      <label>
        List
        <select
          value={filters.list}
          onChange={(event) => onFilterChange('list', event.target.value)}
          id="listFilter"
        >
          {listOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

export default Filters;

function TraineeMetric({ Icon, tone, title, value, detail }) {
  return (
    <article className="trainee-metric">
      <i className={tone}>
        <Icon size={29} />
      </i>
      <span>
        <small>{title}</small>
        <strong>{value}</strong>
        <em className={tone === "orange" ? "neutral" : ""}>{detail}</em>
      </span>
    </article>
  );
}

export default TraineeMetric;

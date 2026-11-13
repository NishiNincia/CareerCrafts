const TURNOVER_LIMITS_CRORE = Object.freeze({
    micro: 10,
    small: 100,
});

export function getCompanyEligibility(companySize, annualTurnoverCr) {
    const turnoverLimitCr = TURNOVER_LIMITS_CRORE[companySize] ?? null;
    const hasTurnover = annualTurnoverCr !== null
        && annualTurnoverCr !== undefined
        && String(annualTurnoverCr).trim() !== "";
    const eligible = turnoverLimitCr !== null
        && hasTurnover
        && Number.isFinite(Number(annualTurnoverCr))
        && Number(annualTurnoverCr) >= 0
        && Number(annualTurnoverCr) <= turnoverLimitCr;
    return { eligible, turnoverLimitCr };
}

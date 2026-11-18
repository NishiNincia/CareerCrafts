export function validateGigPayload(body) {
    const { title, description, requiredSkills, budget, deadline, workMode, locationAddress, geo } = body || {};
    const budgetValue = Number(budget);
    const deadlineDate = new Date(`${deadline}T00:00:00.000Z`);
    const skills = Array.isArray(requiredSkills)
        ? requiredSkills.map((skill) => String(skill).trim()).filter(Boolean).slice(0, 30)
        : [];
    if (
        typeof title !== "string" || title.trim().length < 3 || title.trim().length > 180
        || typeof description !== "string" || description.trim().length < 10 || description.trim().length > 10000
        || !Number.isFinite(budgetValue) || budgetValue <= 0 || budgetValue > 1_000_000_000
        || !["online", "on_site"].includes(workMode)
        || typeof deadline !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)
        || Number.isNaN(deadlineDate.getTime()) || deadlineDate.toISOString().slice(0, 10) !== deadline
        || deadline < new Date().toISOString().slice(0, 10)
        || skills.length === 0
    ) {
        return { error: "Enter a title, description, required skills, positive budget, future deadline, and valid work mode." };
    }

    let address = null;
    let lat = null;
    let lng = null;
    if (workMode === "on_site") {
        lat = Number(geo?.lat);
        lng = Number(geo?.lng);
        if (
            typeof locationAddress !== "string" || locationAddress.trim().length < 4
            || !Number.isFinite(lat) || lat < -90 || lat > 90
            || !Number.isFinite(lng) || lng < -180 || lng > 180
        ) {
            return { error: "On-site gigs require an address and valid latitude/longitude coordinates." };
        }
        address = locationAddress.trim();
    }

    return {
        value: {
            title: title.trim(),
            description: description.trim(),
            requiredSkills: skills,
            budget: budgetValue,
            deadline,
            workMode,
            locationAddress: address,
            locationLat: lat,
            locationLng: lng,
        },
    };
}

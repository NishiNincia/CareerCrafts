function gigRoute(id) {
    return `/worker/gigs?gigId=${encodeURIComponent(id)}`;
}

function jobRoute(id) {
    return `/worker/jobs?jobId=${encodeURIComponent(id)}`;
}

export function validateGigNotificationPreferences(input) {
    const gigRadiusKm = Number(input?.gigRadiusKm);
    const latitude = input?.latitude === null || input?.latitude === undefined ? null : Number(input.latitude);
    const longitude = input?.longitude === null || input?.longitude === undefined ? null : Number(input.longitude);
    if (
        !Number.isFinite(gigRadiusKm) || gigRadiusKm < 1 || gigRadiusKm > 100 ||
        (latitude === null) !== (longitude === null) ||
        (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
        (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
    ) {
        return { error: "Set a gig radius from 1 to 100 km and provide both valid coordinates or neither." };
    }
    return { value: { gigRadiusKm, latitude, longitude } };
}

export async function notifyWorkersOfNewJob(database, job) {
    await database.query(
        `INSERT INTO app_notifications (user_id, type, title, body, reference_id, route)
         SELECT id, 'job', $2, $3, $1, $4
         FROM users
         WHERE lower(role) = 'worker'
         ON CONFLICT (user_id, type, reference_id)
             WHERE reference_id IS NOT NULL AND type IN ('gig', 'job')
         DO NOTHING`,
        [job.id, `New job: ${job.title}`, `A new job is available at ${job.company || "a hiring company"}.`, jobRoute(job.id)]
    );
}

export async function notifyWorkersOfNewGig(database, gig) {
    await database.query(
        `INSERT INTO app_notifications (user_id, type, title, body, reference_id, route)
         SELECT pref.user_id, 'gig', $2, $3, $1, $4
         FROM worker_notification_preferences pref
         JOIN users u ON u.id = pref.user_id
         WHERE lower(u.role) = 'worker'
           AND (
               $5 = 'online'
               OR (
                   pref.latitude IS NOT NULL
                   AND 6371 * 2 * asin(sqrt(LEAST(1,
                       power(sin(radians(pref.latitude - $6::double precision) / 2), 2)
                       + cos(radians($6::double precision)) * cos(radians(pref.latitude))
                       * power(sin(radians(pref.longitude - $7::double precision) / 2), 2)
                   ))) <= pref.gig_radius_km
               )
           )
         ON CONFLICT (user_id, type, reference_id)
             WHERE reference_id IS NOT NULL AND type IN ('gig', 'job')
         DO NOTHING`,
        [
            gig.id,
            `New gig: ${gig.title}`,
            gig.work_mode === "online" ? "A new online gig is available." : "A new on-site gig is available within your notification radius.",
            gigRoute(gig.id),
            gig.work_mode,
            gig.latitude,
            gig.longitude,
        ]
    );
}

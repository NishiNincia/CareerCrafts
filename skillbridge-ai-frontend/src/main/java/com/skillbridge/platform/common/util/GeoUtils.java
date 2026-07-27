package com.skillbridge.platform.common.util;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

/**
 * Helper for constructing PostGIS {@link Point} geometries (SRID 4326 / WGS84)
 * used by jobs, gigs, live-tracking, and worker location fields.
 */
public final class GeoUtils {

    public static final int SRID_WGS84 = 4326;

    private static final GeometryFactory FACTORY = new GeometryFactory(new PrecisionModel(), SRID_WGS84);

    private GeoUtils() {
    }

    public static Point toPoint(double latitude, double longitude) {
        Point point = FACTORY.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(SRID_WGS84);
        return point;
    }

    public static double getLatitude(Point point) {
        return point == null ? 0d : point.getY();
    }

    public static double getLongitude(Point point) {
        return point == null ? 0d : point.getX();
    }
}

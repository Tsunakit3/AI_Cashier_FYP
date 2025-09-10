import React, { useEffect, useState } from "react";
import { DeckGL } from "@deck.gl/react";
import { PathLayer, ScatterplotLayer, BitmapLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { MapView } from "@deck.gl/core";
import { station_coords } from "../data/station_coords";

// Helper to compute center and zoom to fit a bounding box
function getViewStateFromBounds(bounds, width, height, padding = 0.1) {
  const [minLon, minLat, maxLon, maxLat] = bounds;

  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;

  const lonDiff = maxLon - minLon;
  const latDiff = maxLat - minLat;

  const worldMaxZoom = 19;
  const minZoom = 10; // Region-level minimum zoom to show whole route
  // Approximate zoom to fit bounds in viewport
  const zoomLon = Math.log2(width / 256 / lonDiff);
  const zoomLat = Math.log2(height / 256 / latDiff);
  let zoom = Math.min(zoomLon, zoomLat);
  zoom = Math.min(zoom, worldMaxZoom);
  zoom -= padding; // optional padding
  zoom = Math.max(zoom, minZoom); // Prevent zooming out too far

  return { longitude: centerLon, latitude: centerLat, zoom, pitch: 0 };
}

export default function RouteMap({ routeDetails }) {
  const [routeData, setRouteData] = useState(null);
  const [viewState, setViewState] = useState(null);
  const [animatedPathLength, setAnimatedPathLength] = useState(0); // NEW

  useEffect(() => {
    if (!routeDetails) return;

    const { station_lines = [], interchanges = [] } = routeDetails;

    let fullNames = [];
    station_lines.forEach((seg, idx) => {
      if (idx > 0 && interchanges[idx - 1] && fullNames[fullNames.length - 1] !== interchanges[idx - 1]) {
        fullNames.push(interchanges[idx - 1]);
      }
      fullNames.push(...seg);
    });

    const coords = [];
    const stations = [];

    fullNames.forEach((name, i) => {
      const pt = station_coords[name];
      if (!pt) return;

      const [lat, lon] = pt;
      coords.push([lon, lat]);

      let type = "normal";
      if (i === 0) type = "start";
      else if (i === fullNames.length - 1) type = "end";
      else if (interchanges.includes(name)) type = "interchange";

      stations.push({ name, lat, lon, type });
    });

    if (coords.length >= 2) {
      setRouteData({ stations, path: coords });
      setAnimatedPathLength(1); // start animation

      // Compute viewState as before
      const lons = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      const view = getViewStateFromBounds([minLon, minLat, maxLon, maxLat], window.innerWidth, window.innerHeight);
      setViewState(view);
    }
  }, [routeDetails]);

  // Animate path incrementally
  useEffect(() => {
    if (!routeData) return;
    if (animatedPathLength >= routeData.path.length) return;

    const interval = setInterval(() => {
      setAnimatedPathLength(prev => {
        if (prev >= routeData.path.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 200); // 200ms per segment
    return () => clearInterval(interval);
  }, [routeData, animatedPathLength]);

  if (!routeData || routeData.stations.length === 0) return <div>No route data available.</div>;
  if (!viewState) return <div>Calculating view...</div>;

  // Only change: slice the path for animation
  const pathLayer = new PathLayer({
    id: "route-path",
    data: [{ path: routeData.path.slice(0, animatedPathLength) }],
    getPath: d => d.path,
    getColor: [0, 128, 255],
    widthScale: 6,
    widthMinPixels: 4,
  });

  const stationLayer = new ScatterplotLayer({
    id: "stations",
    data: routeData.stations,
    getPosition: d => [d.lon, d.lat],
    getFillColor: d =>
      d.type === "start"
        ? [34, 139, 34]
        : d.type === "end"
        ? [200, 30, 30]
        : d.type === "interchange"
        ? [255, 165, 0]
        : [200, 200, 200],
    getRadius: 150,
    pickable: true,
  });

  const tileLayer = new TileLayer({
    id: "osm-tiles",
    data: "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
    minZoom: 0,
    maxZoom: 19,
    tileSize: 256,
    renderSubLayers: props => {
        const { boundingBox } = props.tile;
        if (!props.data || !boundingBox) return null;
        return new BitmapLayer(props, {
        data: null,
        image: props.data,
        bounds: [
            boundingBox[0][0], boundingBox[0][1],
            boundingBox[1][0], boundingBox[1][1]
        ]
        });
    },
    pickable: true
    });

  if (!viewState) return <div>Calculating view...</div>;

  return (
    <DeckGL
      initialViewState={viewState}
      controller={true}
      views={new MapView({ repeat: true })}
      layers={[tileLayer, pathLayer, stationLayer]}
      style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
    />
  );
}

import numpy as np
from typing import List, Dict, Any

class TrajectoryEngine:
    """
    Interpolates vehicle kinematic waypoints into smooth 3D coordinates for Three.js WebGL rendering.
    """

    @staticmethod
    def generate_default_intersection_trajectory() -> List[Dict[str, Any]]:
        """
        Generates standard 4-way intersection T-bone collision trajectory:
        - Vehicle A (Red Sedan): Traveling Westbound (-X to +X) along Z=1.75
        - Vehicle B (Blue SUV): Traveling Southbound (-Z to +Z) along X=1.75
        - Impact point at t=2.8s near (1.5, 0.5)
        """
        frames = []
        times = np.arange(0.0, 4.2, 0.2)

        for t in times:
            t = round(float(t), 2)
            
            # Vehicle A: Starts at x = -25m, moving at ~13.3 m/s (48 km/h)
            # Brakes at t=2.0s
            if t < 2.0:
                xA = -25.0 + (t * 11.5)
                speedA = 48.0
                brakingA = False
                headingA = 90.0
                zA = 1.75
            elif t < 2.8:
                # Decelerating
                xA = -2.0 + ((t - 2.0) * 4.375)
                speedA = 48.0 - ((t - 2.0) * 28.0)
                brakingA = True
                headingA = 90.0
                zA = 1.75
            else:
                # Post impact deflection
                dt = t - 2.8
                xA = 1.5 + (dt * 1.5)
                zA = 1.75 + (dt * 0.7)
                speedA = max(0.0, 25.0 - (dt * 18.0))
                brakingA = True
                headingA = max(70.0, 90.0 - (dt * 15.0))

            # Vehicle B: Starts at z = -25m, moving South at ~10 m/s (36 km/h)
            if t < 2.8:
                xB = 1.75
                zB = -25.0 + (t * 9.1)
                speedB = 36.0
                brakingB = False
                headingB = 180.0
            else:
                dt = t - 2.8
                xB = 1.75 + (dt * 1.8)
                zB = 0.5 + (dt * 2.1)
                speedB = max(0.0, 30.0 - (dt * 22.0))
                brakingB = True
                headingB = max(140.0, 180.0 - (dt * 30.0))

            # Traffic signals
            if t < 1.4:
                tl = "GREEN"
            elif t < 2.1:
                tl = "YELLOW"
            else:
                tl = "RED"

            is_impact = (2.7 <= t <= 2.9)

            frames.append({
                "timeSec": t,
                "vehicleA": {
                    "x": round(float(xA), 2),
                    "z": round(float(zA), 2),
                    "speedKmh": round(float(speedA), 1),
                    "headingDeg": round(float(headingA), 1),
                    "braking": brakingA,
                    "uncertaintyRadiusMeters": 0.4 if t < 2.8 else 0.8
                },
                "vehicleB": {
                    "x": round(float(xB), 2),
                    "z": round(float(zB), 2),
                    "speedKmh": round(float(speedB), 1),
                    "headingDeg": round(float(headingB), 1),
                    "braking": brakingB,
                    "uncertaintyRadiusMeters": 0.5 if t < 2.8 else 0.9
                },
                "trafficLight": tl,
                "isImpactPoint": is_impact
            })

        return frames

trajectory_engine = TrajectoryEngine()


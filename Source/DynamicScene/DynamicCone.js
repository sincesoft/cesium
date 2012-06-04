/*global define*/
define([
        '../Core/TimeInterval',
        './CzmlBoolean',
        './CzmlNumber',
        './CzmlColor',
        './DynamicProperty',
        './DynamicMaterialProperty'
       ], function(
         TimeInterval,
         CzmlBoolean,
         CzmlNumber,
         CzmlColor,
         DynamicProperty,
         DynamicMaterialProperty) {
    "use strict";

    function DynamicCone() {
        this.capMaterial = undefined;
        this.innerHalfAngle = undefined;
        this.innerMaterial = undefined;
        this.intersectionColor = undefined;
        this.maximumClockAngle = undefined;
        this.minimumClockAngle = undefined;
        this.outerHalfAngle = undefined;
        this.outerMaterial = undefined;
        this.radius = undefined;
        this.show = undefined;
        this.showIntersection = undefined;
        this.silhouetteMaterial = undefined;
    }

    DynamicCone.processCzmlPacket = function(dynamicObject, packet, czmlObjectCollection, sourceUri) {
        //See if there's any actual data to process.
        var coneData = packet.cone, cone;
        if (typeof coneData !== 'undefined') {

            var coneUpdated = false;
            cone = dynamicObject.cone;

            //Create a new cone if we don't have one yet.
            if (typeof cone === 'undefined') {
                cone = new DynamicCone();
                dynamicObject.cone = cone;
                coneUpdated = true;
            }

            var interval = coneData.interval;
            if (typeof interval !== 'undefined') {
                interval = TimeInterval.fromIso8601(interval);
            }

            //Create or update each of the properties.
            coneUpdated = DynamicProperty.processCzmlPacket(cone, "show", CzmlBoolean, coneData.show, interval, czmlObjectCollection) || coneUpdated;
            coneUpdated = DynamicProperty.processCzmlPacket(cone, "innerHalfAngle", CzmlNumber, coneData.innerHalfAngle, interval, czmlObjectCollection) || coneUpdated;
            coneUpdated = DynamicProperty.processCzmlPacket(cone, "outerHalfAngle", CzmlNumber, coneData.outerHalfAngle, interval, czmlObjectCollection) || coneUpdated;
            coneUpdated = DynamicProperty.processCzmlPacket(cone, "minimumClockAngle", CzmlNumber, coneData.minimumClockAngle, interval, czmlObjectCollection) || coneUpdated;
            coneUpdated = DynamicProperty.processCzmlPacket(cone, "maximumClockAngle", CzmlNumber, coneData.maximumClockAngle, interval, czmlObjectCollection) || coneUpdated;
            coneUpdated = DynamicProperty.processCzmlPacket(cone, "radius", CzmlNumber, coneData.radius, interval, czmlObjectCollection) || coneUpdated;
            coneUpdated = DynamicProperty.processCzmlPacket(cone, "showIntersection", CzmlBoolean, coneData.showIntersection, interval, czmlObjectCollection) || coneUpdated;
            coneUpdated = DynamicProperty.processCzmlPacket(cone, "intersectionColor", CzmlColor, coneData.intersectionColor, interval, czmlObjectCollection) || coneUpdated;
            coneUpdated = DynamicMaterialProperty.processCzmlPacket(cone, "capMaterial", coneData.capMaterial, interval, czmlObjectCollection) || coneUpdated;
            coneUpdated = DynamicMaterialProperty.processCzmlPacket(cone, "innerMaterial", coneData.innerMaterial, interval, czmlObjectCollection) || coneUpdated;
            coneUpdated = DynamicMaterialProperty.processCzmlPacket(cone, "outerMaterial", coneData.outerMaterial, interval, czmlObjectCollection) || coneUpdated;
            coneUpdated = DynamicMaterialProperty.processCzmlPacket(cone, "silhouetteMaterial", coneData.silhouetteMaterial, interval, czmlObjectCollection) || coneUpdated;
        }
    };

    DynamicCone.mergeProperties = function(targetObject, objectToMerge) {
        var coneToMerge = objectToMerge.cone;
        if (typeof coneToMerge !== 'undefined') {
            var targetCone = targetObject.cone;
            if (typeof targetCone === 'undefined') {
                targetCone = new DynamicCone();
                targetObject.cone = targetCone;
            }
            targetCone.show = targetCone.show || coneToMerge.show;
            targetCone.innerHalfAngle = targetCone.innerHalfAngle || coneToMerge.innerHalfAngle;
            targetCone.outerHalfAngle = targetCone.outerHalfAngle || coneToMerge.outerHalfAngle;
            targetCone.minimumClockAngle = targetCone.minimumClockAngle || coneToMerge.minimumClockAngle;
            targetCone.maximumClockAngle = targetCone.maximumClockAngle || coneToMerge.maximumClockAngle;
            targetCone.radius = targetCone.radius || coneToMerge.radius;
            targetCone.showIntersection = targetCone.showIntersection || coneToMerge.showIntersection;
            targetCone.intersectionColor = targetCone.intersectionColor || coneToMerge.intersectionColor;
            targetCone.capMaterial = targetCone.capMaterial || coneToMerge.capMaterial;
            targetCone.innerMaterial = targetCone.innerMaterial || coneToMerge.innerMaterial;
            targetCone.outerMaterial = targetCone.outerMaterial || coneToMerge.outerMaterial;
            targetCone.silhouetteMaterial = targetCone.silhouetteMaterial || coneToMerge.silhouetteMaterial;
        }
    };

    DynamicCone.undefineProperties = function(dynamicObject) {
        dynamicObject.cone = undefined;
    };

    return DynamicCone;
});

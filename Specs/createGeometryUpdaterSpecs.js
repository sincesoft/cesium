define([
    'Core/BoundingSphere',
    'Core/Color',
    'Core/ColorGeometryInstanceAttribute',
    'Core/DistanceDisplayCondition',
    'Core/JulianDate',
    'Core/Math',
    'Core/ShowGeometryInstanceAttribute',
    'Core/TimeInterval',
    'DataSources/BoundingSphereState',
    'DataSources/ColorMaterialProperty',
    'DataSources/ConstantProperty',
    'DataSources/Entity',
    'DataSources/GridMaterialProperty',
    'DataSources/SampledProperty',
    'DataSources/TimeIntervalCollectionProperty',
    'Scene/ShadowMode',
    'Specs/pollToPromise'
], function(
    BoundingSphere,
    Color,
    ColorGeometryInstanceAttribute,
    DistanceDisplayCondition,
    JulianDate,
    CesiumMath,
    ShowGeometryInstanceAttribute,
    TimeInterval,
    BoundingSphereState,
    ColorMaterialProperty,
    ConstantProperty,
    Entity,
    GridMaterialProperty,
    SampledProperty,
    TimeIntervalCollectionProperty,
    ShadowMode,
    pollToPromise) {
    'use strict';

    function createGeometryUpdaterSpecs(Updater, geometryPropertyName, createEntity, getScene) {
        var time = JulianDate.now();

        it('Constructor sets expected defaults', function() {
            var scene = getScene();
            var entity = createEntity();
            var updater = new Updater(entity, scene);

            expect(updater.isDestroyed()).toBe(false);
            expect(updater.entity).toBe(entity);
            expect(updater.isClosed).toBe(false);
            expect(updater.fillEnabled).toBe(false);
            expect(updater.fillMaterialProperty).toBe(undefined);
            expect(updater.outlineEnabled).toBe(false);
            expect(updater.hasConstantFill).toBe(true);
            expect(updater.hasConstantOutline).toBe(true);
            expect(updater.outlineColorProperty).toBe(undefined);
            expect(updater.outlineWidth).toBe(1.0);
            expect(updater.shadowsProperty).toBe(undefined);
            expect(updater.distanceDisplayConditionProperty).toBe(undefined);
            expect(updater.isDynamic).toBe(false);
            expect(updater.onTerrain).toBe(false);
            expect(updater.isOutlineVisible(time)).toBe(false);
            expect(updater.isFilled(time)).toBe(false);
            updater.destroy();
            expect(updater.isDestroyed()).toBe(true);
        });

        it('No geometry created when entity geometry property is undefined ', function() {
            var scene = getScene();
            var entity = new Entity();
            var updater = new Updater(entity, scene);

            expect(updater.fillEnabled).toBe(false);
            expect(updater.outlineEnabled).toBe(false);
            expect(updater.isDynamic).toBe(false);
        });

        it('No geometry available when not filled or outline.', function() {
            var scene = getScene();
            var entity = createEntity();
            entity[geometryPropertyName].fill = new ConstantProperty(false);
            entity[geometryPropertyName].outline = new ConstantProperty(false);
            var updater = new Updater(entity, scene);

            expect(updater.fillEnabled).toBe(false);
            expect(updater.outlineEnabled).toBe(false);
            expect(updater.isDynamic).toBe(false);
        });

        it('Values correct when using default graphics', function() {
            var scene = getScene();
            var entity = createEntity();
            var updater = new Updater(entity, scene);

            expect(updater.isClosed).toBe(updater._getIsClosed(updater._options));
            expect(updater.fillEnabled).toBe(true);
            expect(updater.fillMaterialProperty).toEqual(new ColorMaterialProperty(Color.WHITE));
            expect(updater.outlineEnabled).toBe(false);
            expect(updater.hasConstantFill).toBe(true);
            expect(updater.hasConstantOutline).toBe(true);
            expect(updater.outlineColorProperty).toBe(undefined);
            expect(updater.outlineWidth).toBe(1.0);
            expect(updater.shadowsProperty).toEqual(new ConstantProperty(ShadowMode.DISABLED));
            expect(updater.distanceDisplayConditionProperty).toEqual(new ConstantProperty(new DistanceDisplayCondition()));
            expect(updater.isDynamic).toBe(false);
        });

        it('material is correctly exposed.', function() {
            var scene = getScene();
            var entity = createEntity();
            entity[geometryPropertyName].material = new GridMaterialProperty(Color.BLUE);
            var updater = new Updater(entity, scene);

            expect(updater.fillMaterialProperty).toBe(entity[geometryPropertyName].material);
        });

        it('A time-varying outlineWidth causes geometry to be dynamic', function() {
            var scene = getScene();
            var entity = createEntity();
            entity[geometryPropertyName].outlineWidth = new SampledProperty(Number);
            entity[geometryPropertyName].outlineWidth.addSample(time, 1);
            var updater = new Updater(entity, scene);

            expect(updater.isDynamic).toBe(true);
        });

        it('A time-varying color causes ground geometry to be dynamic', function() {
            var scene = getScene();
            var entity = createEntity();
            var color = new SampledProperty(Color);
            color.addSample(time, Color.WHITE);
            entity[geometryPropertyName].material = new ColorMaterialProperty(color);
            var updater = new Updater(entity, scene);

            expect(updater.isDynamic).toBe(true);
        });

        it('Correctly exposes outlineWidth', function() {
            var scene = getScene();
            var entity = createEntity();
            entity[geometryPropertyName].outlineWidth = new ConstantProperty(8);
            var updater = new Updater(entity, scene);
            expect(updater.outlineWidth).toBe(8);
        });

        it('Attributes have expected values at creation time', function() {
            var scene = getScene();
            var time1 = new JulianDate(0, 0);
            var time2 = new JulianDate(10, 0);
            var time3 = new JulianDate(20, 0);

            var fill = new TimeIntervalCollectionProperty();
            fill.intervals.addInterval(new TimeInterval({
                start : time1,
                stop : time2,
                data : false
            }));
            fill.intervals.addInterval(new TimeInterval({
                start : time2,
                stop : time3,
                isStartIncluded : false,
                data : true
            }));

            var colorMaterial = new ColorMaterialProperty();
            colorMaterial.color = new SampledProperty(Color);
            colorMaterial.color.addSample(time, Color.YELLOW);
            colorMaterial.color.addSample(time2, Color.BLUE);
            colorMaterial.color.addSample(time3, Color.RED);

            var outline = new TimeIntervalCollectionProperty();
            outline.intervals.addInterval(new TimeInterval({
                start : time1,
                stop : time2,
                data : false
            }));
            outline.intervals.addInterval(new TimeInterval({
                start : time2,
                stop : time3,
                isStartIncluded : false,
                data : true
            }));

            var outlineColor = new SampledProperty(Color);
            outlineColor.addSample(time, Color.BLUE);
            outlineColor.addSample(time2, Color.RED);
            outlineColor.addSample(time3, Color.YELLOW);

            var entity = createEntity();
            entity[geometryPropertyName].fill = fill;
            entity[geometryPropertyName].material = colorMaterial;
            entity[geometryPropertyName].outline = outline;
            entity[geometryPropertyName].outlineColor = outlineColor;

            var updater = new Updater(entity, scene);

            var instance = updater.createFillGeometryInstance(time2);
            var attributes = instance.attributes;
            expect(attributes.color.value).toEqual(ColorGeometryInstanceAttribute.toValue(colorMaterial.color.getValue(time2)));
            expect(attributes.show.value).toEqual(ShowGeometryInstanceAttribute.toValue(fill.getValue(time2)));

            instance = updater.createOutlineGeometryInstance(time2);
            attributes = instance.attributes;
            expect(attributes.color.value).toEqual(ColorGeometryInstanceAttribute.toValue(outlineColor.getValue(time2)));
            expect(attributes.show.value).toEqual(ShowGeometryInstanceAttribute.toValue(outline.getValue(time2)));
        });

        it('createFillGeometryInstance obeys Entity.show is false.', function() {
            var scene = getScene();
            var entity = createEntity();
            entity.show = false;
            entity[geometryPropertyName].fill = true;
            var updater = new Updater(entity, scene);
            var instance = updater.createFillGeometryInstance(new JulianDate());
            var attributes = instance.attributes;
            expect(attributes.show.value).toEqual(ShowGeometryInstanceAttribute.toValue(false));
        });

        it('createOutlineGeometryInstance obeys Entity.show is false.', function() {
            var scene = getScene();
            var entity = createEntity();
            entity.show = false;
            entity[geometryPropertyName].outline = true;
            var updater = new Updater(entity, scene);
            var instance = updater.createFillGeometryInstance(new JulianDate());
            var attributes = instance.attributes;
            expect(attributes.show.value).toEqual(ShowGeometryInstanceAttribute.toValue(false));
        });

        it('createFillGeometryInstance throws if object is not filled', function() {
            var scene = getScene();
            var entity = new Entity();
            var updater = new Updater(entity, scene);
            expect(function() {
                return updater.createFillGeometryInstance(time);
            }).toThrowDeveloperError();
        });

        it('createFillGeometryInstance throws if no time provided', function() {
            var scene = getScene();
            var entity = createEntity();
            var updater = new Updater(entity, scene);
            expect(function() {
                return updater.createFillGeometryInstance(undefined);
            }).toThrowDeveloperError();
        });

        it('createOutlineGeometryInstance throws if object is not outlined', function() {
            var scene = getScene();
            var entity = new Entity();
            var updater = new Updater(entity, scene);
            expect(function() {
                return updater.createOutlineGeometryInstance(time);
            }).toThrowDeveloperError();
        });

        it('createOutlineGeometryInstance throws if no time provided', function() {
            var scene = getScene();
            var entity = createEntity();
            entity.polygon.outline = new ConstantProperty(true);
            var updater = new Updater(entity, scene);
            expect(function() {
                return updater.createOutlineGeometryInstance(undefined);
            }).toThrowDeveloperError();
        });
    }

    return createGeometryUpdaterSpecs;
});

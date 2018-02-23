defineSuite([
        'DataSources/CylinderGeometryUpdater',
        'Core/Cartesian3',
        'Core/Color',
        'Core/ColorGeometryInstanceAttribute',
        'Core/DistanceDisplayCondition',
        'Core/DistanceDisplayConditionGeometryInstanceAttribute',
        'Core/JulianDate',
        'Core/Quaternion',
        'Core/ShowGeometryInstanceAttribute',
        'Core/TimeInterval',
        'Core/TimeIntervalCollection',
        'DataSources/ColorMaterialProperty',
        'DataSources/ConstantPositionProperty',
        'DataSources/ConstantProperty',
        'DataSources/CylinderGraphics',
        'DataSources/Entity',
        'DataSources/GridMaterialProperty',
        'DataSources/SampledPositionProperty',
        'DataSources/SampledProperty',
        'DataSources/TimeIntervalCollectionProperty',
        'Scene/PrimitiveCollection',
        'Scene/ShadowMode',
        'Specs/createDynamicGeometryBoundingSphereSpecs',
        'Specs/createDynamicProperty',
        'Specs/createGeometryUpdaterSpecs',
        'Specs/createScene'
    ], function(
        CylinderGeometryUpdater,
        Cartesian3,
        Color,
        ColorGeometryInstanceAttribute,
        DistanceDisplayCondition,
        DistanceDisplayConditionGeometryInstanceAttribute,
        JulianDate,
        Quaternion,
        ShowGeometryInstanceAttribute,
        TimeInterval,
        TimeIntervalCollection,
        ColorMaterialProperty,
        ConstantPositionProperty,
        ConstantProperty,
        CylinderGraphics,
        Entity,
        GridMaterialProperty,
        SampledPositionProperty,
        SampledProperty,
        TimeIntervalCollectionProperty,
        PrimitiveCollection,
        ShadowMode,
        createDynamicGeometryBoundingSphereSpecs,
        createDynamicProperty,
        createGeometryUpdaterSpecs,
        createScene) {
    'use strict';

    var scene;
    var time;

    beforeAll(function() {
        scene = createScene();
        time = JulianDate.now();
    });

    afterAll(function() {
        scene.destroyForSpecs();
    });

    function createBasicCylinder() {
        var cylinder = new CylinderGraphics();
        cylinder.length = new ConstantProperty(1000);
        cylinder.topRadius = new ConstantProperty(1000);
        cylinder.bottomRadius = new ConstantProperty(1000);

        var entity = new Entity();
        entity.position = new ConstantPositionProperty(Cartesian3.fromDegrees(0, 0, 0));
        entity.cylinder = cylinder;
        return entity;
    }

    it('No geometry available when topRadius is undefined', function() {
        var entity = createBasicCylinder();
        var updater = new CylinderGeometryUpdater(entity, scene);
        entity.cylinder.topRadius = undefined;
        updater._onEntityPropertyChanged(entity, 'cylinder');

        expect(updater.fillEnabled).toBe(false);
        expect(updater.outlineEnabled).toBe(false);
        expect(updater.isDynamic).toBe(false);
    });

    it('No geometry available when bottomRadius is undefined', function() {
        var entity = createBasicCylinder();
        var updater = new CylinderGeometryUpdater(entity, scene);
        entity.cylinder.bottomRadius = undefined;
        updater._onEntityPropertyChanged(entity, 'cylinder');

        expect(updater.fillEnabled).toBe(false);
        expect(updater.outlineEnabled).toBe(false);
        expect(updater.isDynamic).toBe(false);
    });

    it('A time-varying position causes geometry to be dynamic', function() {
        var entity = createBasicCylinder();
        var updater = new CylinderGeometryUpdater(entity, scene);
        entity.position = new SampledPositionProperty();
        entity.position.addSample(time, Cartesian3.ZERO);
        updater._onEntityPropertyChanged(entity, 'position');

        expect(updater.isDynamic).toBe(true);
    });

    it('A time-varying bottomRadius causes geometry to be dynamic', function() {
        var entity = createBasicCylinder();
        var updater = new CylinderGeometryUpdater(entity, scene);
        entity.cylinder.bottomRadius = new SampledProperty(Number);
        entity.cylinder.bottomRadius.addSample(time, 1);
        updater._onEntityPropertyChanged(entity, 'cylinder');

        expect(updater.isDynamic).toBe(true);
    });

    it('A time-varying topRadius causes geometry to be dynamic', function() {
        var entity = createBasicCylinder();
        var updater = new CylinderGeometryUpdater(entity, scene);
        entity.cylinder.topRadius = new SampledProperty(Number);
        entity.cylinder.topRadius.addSample(time, 1);
        updater._onEntityPropertyChanged(entity, 'cylinder');

        expect(updater.isDynamic).toBe(true);
    });

    it('A time-varying length causes geometry to be dynamic', function() {
        var entity = createBasicCylinder();
        var updater = new CylinderGeometryUpdater(entity, scene);
        entity.cylinder.length = new SampledProperty(Number);
        entity.cylinder.length.addSample(time, 1);
        updater._onEntityPropertyChanged(entity, 'cylinder');

        expect(updater.isDynamic).toBe(true);
    });

    it('A time-varying numberOfVerticalLines causes geometry to be dynamic', function() {
        var entity = createBasicCylinder();
        var updater = new CylinderGeometryUpdater(entity, scene);
        entity.cylinder.numberOfVerticalLines = new SampledProperty(Number);
        entity.cylinder.numberOfVerticalLines.addSample(time, 1);
        updater._onEntityPropertyChanged(entity, 'cylinder');

        expect(updater.isDynamic).toBe(true);
    });

    function validateGeometryInstance(options) {
        var entity = new Entity();
        entity.position = new ConstantPositionProperty(options.position);
        entity.orientation = new ConstantProperty(options.orientation);

        var cylinder = new CylinderGraphics();
        cylinder.show = new ConstantProperty(options.show);
        cylinder.fill = new ConstantProperty(options.fill);
        cylinder.material = options.material;
        cylinder.outline = new ConstantProperty(options.outline);
        cylinder.outlineColor = new ConstantProperty(options.outlineColor);
        cylinder.numberOfVerticalLines = new ConstantProperty(options.numberOfVerticalLines);
        cylinder.length = new ConstantProperty(options.length);
        cylinder.topRadius = new ConstantProperty(options.topRadius);
        cylinder.bottomRadius = new ConstantProperty(options.bottomRadius);
        cylinder.distanceDisplayCondition = options.distanceDisplayCondition;
        entity.cylinder = cylinder;

        var updater = new CylinderGeometryUpdater(entity, scene);

        var instance;
        var geometry;
        var attributes;
        if (options.fill) {
            instance = updater.createFillGeometryInstance(time);
            geometry = instance.geometry;
            expect(geometry._topRadius).toEqual(options.topRadius);
            expect(geometry._bottomRadius).toEqual(options.bottomRadius);
            expect(geometry._length).toEqual(options.length);

            attributes = instance.attributes;
            if (options.material instanceof ColorMaterialProperty) {
                expect(attributes.color.value).toEqual(ColorGeometryInstanceAttribute.toValue(options.material.color.getValue(time)));
            } else {
                expect(attributes.color).toBeUndefined();
            }
            expect(attributes.show.value).toEqual(ShowGeometryInstanceAttribute.toValue(options.fill));
            if (options.distanceDisplayCondition) {
                expect(attributes.distanceDisplayCondition.value).toEqual(DistanceDisplayConditionGeometryInstanceAttribute.toValue(options.distanceDisplayCondition));
            }
        }

        if (options.outline) {
            instance = updater.createOutlineGeometryInstance(time);
            geometry = instance.geometry;
            expect(geometry._topRadius).toEqual(options.topRadius);
            expect(geometry._bottomRadius).toEqual(options.bottomRadius);
            expect(geometry._length).toEqual(options.length);
            expect(geometry._numberOfVerticalLines).toEqual(options.numberOfVerticalLines);

            attributes = instance.attributes;
            expect(attributes.color.value).toEqual(ColorGeometryInstanceAttribute.toValue(options.outlineColor));
            expect(attributes.show.value).toEqual(ShowGeometryInstanceAttribute.toValue(options.fill));
            if (options.distanceDisplayCondition) {
                expect(attributes.distanceDisplayCondition.value).toEqual(DistanceDisplayConditionGeometryInstanceAttribute.toValue(options.distanceDisplayCondition));
            }
        }
    }

    it('Creates expected per-color geometry', function() {
        validateGeometryInstance({
            position : new Cartesian3(4, 5, 6),
            orientation : Quaternion.IDENTITY,
            length : 1,
            topRadius : 3,
            bottomRadius : 2,
            show : true,
            material : new ColorMaterialProperty(Color.RED),
            fill : true,
            outline : true,
            outlineColor : Color.BLUE,
            numberOfVerticalLines : 15
        });
    });

    it('Creates expected per-material geometry', function() {
        validateGeometryInstance({
            position : new Cartesian3(4, 5, 6),
            orientation : Quaternion.IDENTITY,
            length : 1,
            topRadius : 3,
            bottomRadius : 2,
            show : true,
            material : new GridMaterialProperty(),
            fill : true,
            outline : true,
            outlineColor : Color.BLUE,
            numberOfVerticalLines : 15
        });
    });

    it('Creates expected distance display condition geometry', function() {
        validateGeometryInstance({
            position : new Cartesian3(4, 5, 6),
            orientation : Quaternion.IDENTITY,
            length : 1,
            topRadius : 3,
            bottomRadius : 2,
            show : true,
            material : new ColorMaterialProperty(Color.RED),
            fill : true,
            outline : true,
            outlineColor : Color.BLUE,
            numberOfVerticalLines : 15,
            distanceDisplayCondition : new DistanceDisplayCondition(10.0, 100.0)
        });
    });

    it('Attributes have expected values at creation time', function() {
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

        var entity = createBasicCylinder();
        entity.cylinder.fill = fill;
        entity.cylinder.material = colorMaterial;
        entity.cylinder.outline = outline;
        entity.cylinder.outlineColor = outlineColor;

        var updater = new CylinderGeometryUpdater(entity, scene);

        var instance = updater.createFillGeometryInstance(time2);
        var attributes = instance.attributes;
        expect(attributes.color.value).toEqual(ColorGeometryInstanceAttribute.toValue(colorMaterial.color.getValue(time2)));
        expect(attributes.show.value).toEqual(ShowGeometryInstanceAttribute.toValue(fill.getValue(time2)));

        instance = updater.createOutlineGeometryInstance(time2);
        attributes = instance.attributes;
        expect(attributes.color.value).toEqual(ColorGeometryInstanceAttribute.toValue(outlineColor.getValue(time2)));
        expect(attributes.show.value).toEqual(ShowGeometryInstanceAttribute.toValue(outline.getValue(time2)));
    });

    it('dynamic updater sets properties', function() {
        var cylinder = new CylinderGraphics();
        cylinder.show = createDynamicProperty(true);
        cylinder.topRadius = createDynamicProperty(2);
        cylinder.bottomRadius = createDynamicProperty(1);
        cylinder.length = createDynamicProperty(3);
        cylinder.outline = createDynamicProperty(true);
        cylinder.fill = createDynamicProperty(true);

        var entity = new Entity();
        entity.position = createDynamicProperty(Cartesian3.UNIT_Z);
        entity.orientation = createDynamicProperty(Quaternion.IDENTITY);
        entity.cylinder = cylinder;

        var updater = new CylinderGeometryUpdater(entity, scene);
        var primitives = new PrimitiveCollection();
        var dynamicUpdater = updater.createDynamicUpdater(primitives, new PrimitiveCollection());
        expect(primitives.length).toBe(0);

        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(2);
        expect(dynamicUpdater.isDestroyed()).toBe(false);

        expect(dynamicUpdater._options.id).toBe(entity);
        expect(dynamicUpdater._options.topRadius).toEqual(cylinder.topRadius.getValue());
        expect(dynamicUpdater._options.bottomRadius).toEqual(cylinder.bottomRadius.getValue());

        entity.show = false;
        updater._onEntityPropertyChanged(entity, 'show');
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(0);
        entity.show = true;
        updater._onEntityPropertyChanged(entity, 'show');

        cylinder.show.setValue(false);
        updater._onEntityPropertyChanged(entity, 'cylinder');
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(0);

        cylinder.show.setValue(true);
        cylinder.fill.setValue(false);
        updater._onEntityPropertyChanged(entity, 'cylinder');
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(1);

        cylinder.fill.setValue(true);
        cylinder.outline.setValue(false);
        updater._onEntityPropertyChanged(entity, 'cylinder');
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(1);

        cylinder.length.setValue(undefined);
        updater._onEntityPropertyChanged(entity, 'cylinder');
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(0);

        dynamicUpdater.destroy();
        expect(primitives.length).toBe(0);
        updater.destroy();
    });

    it('geometryChanged event is raised when expected', function() {
        var entity = createBasicCylinder();
        var updater = new CylinderGeometryUpdater(entity, scene);
        var listener = jasmine.createSpy('listener');
        updater.geometryChanged.addEventListener(listener);

        entity.position = new ConstantPositionProperty(Cartesian3.UNIT_Z);
        updater._onEntityPropertyChanged(entity, 'position');
        expect(listener.calls.count()).toEqual(1);

        entity.cylinder.topRadius = new ConstantProperty(82);
        updater._onEntityPropertyChanged(entity, 'cylinder');
        expect(listener.calls.count()).toEqual(2);

        entity.availability = new TimeIntervalCollection();
        updater._onEntityPropertyChanged(entity, 'availability');
        expect(listener.calls.count()).toEqual(3);

        entity.cylinder.topRadius = undefined;
        updater._onEntityPropertyChanged(entity, 'cylinder');
        expect(listener.calls.count()).toEqual(4);

        //Since there's no valid geometry, changing another property should not raise the event.
        entity.cylinder.bottomRadius = undefined;
        updater._onEntityPropertyChanged(entity, 'cylinder');

        //Modifying an unrelated property should not have any effect.
        entity.viewFrom = new ConstantProperty(Cartesian3.UNIT_X);
        updater._onEntityPropertyChanged(entity, 'viewFrom');
        expect(listener.calls.count()).toEqual(4);

        entity.cylinder.topRadius = new SampledProperty(Number);
        entity.cylinder.bottomRadius = new SampledProperty(Number);
        updater._onEntityPropertyChanged(entity, 'cylinder');
        expect(listener.calls.count()).toEqual(5);
    });

    var entity = createBasicCylinder();
    entity.cylinder.topRadius = createDynamicProperty(4);
    createDynamicGeometryBoundingSphereSpecs(CylinderGeometryUpdater, entity, entity.cylinder, function() {
        return scene;
    });

    createGeometryUpdaterSpecs(CylinderGeometryUpdater, 'cylinder', createBasicCylinder, function() {
        return scene;
    });
}, 'WebGL');

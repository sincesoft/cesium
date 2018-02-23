defineSuite([
        'DataSources/PolygonGeometryUpdater',
        'Core/Cartesian3',
        'Core/Color',
        'Core/ColorGeometryInstanceAttribute',
        'Core/DistanceDisplayCondition',
        'Core/DistanceDisplayConditionGeometryInstanceAttribute',
        'Core/JulianDate',
        'Core/PolygonHierarchy',
        'Core/ShowGeometryInstanceAttribute',
        'Core/TimeInterval',
        'Core/TimeIntervalCollection',
        'DataSources/CheckerboardMaterialProperty',
        'DataSources/ColorMaterialProperty',
        'DataSources/ConstantProperty',
        'DataSources/Entity',
        'DataSources/GridMaterialProperty',
        'DataSources/PolygonGraphics',
        'DataSources/PropertyArray',
        'DataSources/SampledPositionProperty',
        'DataSources/SampledProperty',
        'DataSources/TimeIntervalCollectionProperty',
        'Scene/GroundPrimitive',
        'Scene/PrimitiveCollection',
        'Scene/ShadowMode',
        'Specs/createDynamicGeometryBoundingSphereSpecs',
        'Specs/createDynamicProperty',
        'Specs/createGeometryUpdaterSpecs',
        'Specs/createScene'
    ], function(
        PolygonGeometryUpdater,
        Cartesian3,
        Color,
        ColorGeometryInstanceAttribute,
        DistanceDisplayCondition,
        DistanceDisplayConditionGeometryInstanceAttribute,
        JulianDate,
        PolygonHierarchy,
        ShowGeometryInstanceAttribute,
        TimeInterval,
        TimeIntervalCollection,
        CheckerboardMaterialProperty,
        ColorMaterialProperty,
        ConstantProperty,
        Entity,
        GridMaterialProperty,
        PolygonGraphics,
        PropertyArray,
        SampledPositionProperty,
        SampledProperty,
        TimeIntervalCollectionProperty,
        GroundPrimitive,
        PrimitiveCollection,
        ShadowMode,
        createDynamicGeometryBoundingSphereSpecs,
        createDynamicProperty,
        createGeometryUpdaterSpecs,
        createScene) {
    'use strict';

    var scene;
    var time;
    var groundPrimitiveSupported;

    beforeAll(function() {
        scene = createScene();
        time = JulianDate.now();
        groundPrimitiveSupported = GroundPrimitive.isSupported(scene);
    });

    afterAll(function() {
        scene.destroyForSpecs();
    });

    function createBasicPolygon() {
        var polygon = new PolygonGraphics();
        polygon.hierarchy = new ConstantProperty(new PolygonHierarchy(Cartesian3.fromRadiansArray([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ])));
        polygon.height = new ConstantProperty(0);
        var entity = new Entity();
        entity.polygon = polygon;
        return entity;
    }

    function createBasicPolygonWithoutHeight() {
        var polygon = new PolygonGraphics();
        polygon.hierarchy = new ConstantProperty(new PolygonHierarchy(Cartesian3.fromRadiansArray([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ])));
        var entity = new Entity();
        entity.polygon = polygon;
        return entity;
    }

    it('Properly computes isClosed', function() {
        var entity = createBasicPolygon();
        entity.polygon.perPositionHeight = true;
        var updater = new PolygonGeometryUpdater(entity, scene);
        expect(updater.isClosed).toBe(false); //open because of perPositionHeights

        entity.polygon.perPositionHeight = false;
        updater._onEntityPropertyChanged(entity, 'polygon');
        expect(updater.isClosed).toBe(true); //close because polygon is on the ground

        entity.polygon.height = 1000;
        updater._onEntityPropertyChanged(entity, 'polygon');
        expect(updater.isClosed).toBe(false); //open because polygon is at a height

        entity.polygon.extrudedHeight = 1000;
        updater._onEntityPropertyChanged(entity, 'polygon');
        expect(updater.isClosed).toBe(false); //open because height === extrudedHeight so it's not extruded

        entity.polygon.extrudedHeight = 100;
        updater._onEntityPropertyChanged(entity, 'polygon');
        expect(updater.isClosed).toBe(true); //closed because polygon is extruded

        entity.polygon.closeTop = false;
        updater._onEntityPropertyChanged(entity, 'polygon');
        expect(updater.isClosed).toBe(false); //open because top cap isn't included

        entity.polygon.closeTop = true;
        entity.polygon.closeBottom = false;
        updater._onEntityPropertyChanged(entity, 'polygon');
        expect(updater.isClosed).toBe(false); //open because bottom cap isn't included
    });

    it('A time-varying positions causes geometry to be dynamic', function() {
        var entity = createBasicPolygon();
        var updater = new PolygonGeometryUpdater(entity, scene);
        var point1 = new SampledPositionProperty();
        point1.addSample(time, new Cartesian3());
        var point2 = new SampledPositionProperty();
        point2.addSample(time, new Cartesian3());
        var point3 = new SampledPositionProperty();
        point3.addSample(time, new Cartesian3());

        entity.polygon.hierarchy = new PropertyArray();
        entity.polygon.hierarchy.setValue([point1, point2, point3]);
        updater._onEntityPropertyChanged(entity, 'polygon');

        expect(updater.isDynamic).toBe(true);
    });

    it('A time-varying height causes geometry to be dynamic', function() {
        var entity = createBasicPolygon();
        var updater = new PolygonGeometryUpdater(entity, scene);
        entity.polygon.height = new SampledProperty(Number);
        entity.polygon.height.addSample(time, 1);
        updater._onEntityPropertyChanged(entity, 'polygon');

        expect(updater.isDynamic).toBe(true);
    });

    it('A time-varying extrudedHeight causes geometry to be dynamic', function() {
        var entity = createBasicPolygon();
        var updater = new PolygonGeometryUpdater(entity, scene);
        entity.polygon.extrudedHeight = new SampledProperty(Number);
        entity.polygon.extrudedHeight.addSample(time, 1);
        updater._onEntityPropertyChanged(entity, 'polygon');

        expect(updater.isDynamic).toBe(true);
    });

    it('A time-varying granularity causes geometry to be dynamic', function() {
        var entity = createBasicPolygon();
        var updater = new PolygonGeometryUpdater(entity, scene);
        entity.polygon.granularity = new SampledProperty(Number);
        entity.polygon.granularity.addSample(time, 1);
        updater._onEntityPropertyChanged(entity, 'polygon');

        expect(updater.isDynamic).toBe(true);
    });

    it('A time-varying stRotation causes geometry to be dynamic', function() {
        var entity = createBasicPolygon();
        var updater = new PolygonGeometryUpdater(entity, scene);
        entity.polygon.stRotation = new SampledProperty(Number);
        entity.polygon.stRotation.addSample(time, 1);
        updater._onEntityPropertyChanged(entity, 'polygon');

        expect(updater.isDynamic).toBe(true);
    });

    it('A time-varying perPositionHeight causes geometry to be dynamic', function() {
        var entity = createBasicPolygon();
        var updater = new PolygonGeometryUpdater(entity, scene);
        entity.polygon.perPositionHeight = new SampledProperty(Number);
        entity.polygon.perPositionHeight.addSample(time, 1);
        updater._onEntityPropertyChanged(entity, 'polygon');

        expect(updater.isDynamic).toBe(true);
    });

    function validateGeometryInstance(options) {
        var entity = createBasicPolygon();

        var polygon = entity.polygon;
        polygon.show = new ConstantProperty(options.show);
        polygon.fill = new ConstantProperty(options.fill);
        polygon.material = options.material;
        polygon.outline = new ConstantProperty(options.outline);
        polygon.outlineColor = new ConstantProperty(options.outlineColor);
        polygon.perPositionHeight = new ConstantProperty(options.perPositionHeight);
        polygon.closeTop = new ConstantProperty(options.closeTop);
        polygon.closeBottom = new ConstantProperty(options.closeBottom);

        polygon.stRotation = new ConstantProperty(options.stRotation);
        polygon.height = new ConstantProperty(options.height);
        polygon.extrudedHeight = new ConstantProperty(options.extrudedHeight);
        polygon.granularity = new ConstantProperty(options.granularity);
        polygon.distanceDisplayCondition = options.distanceDisplayCondition;

        var updater = new PolygonGeometryUpdater(entity, scene);

        var instance;
        var geometry;
        var attributes;
        if (options.fill) {
            instance = updater.createFillGeometryInstance(time);
            geometry = instance.geometry;
            expect(geometry._stRotation).toEqual(options.stRotation);
            expect(geometry._height).toEqual(options.height);
            expect(geometry._granularity).toEqual(options.granularity);
            expect(geometry._extrudedHeight).toEqual(options.extrudedHeight);
            expect(geometry._closeTop).toEqual(options.closeTop);
            expect(geometry._closeBottom).toEqual(options.closeBottom);

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
            expect(geometry._height).toEqual(options.height);
            expect(geometry._granularity).toEqual(options.granularity);
            expect(geometry._extrudedHeight).toEqual(options.extrudedHeight);
            expect(geometry._perPositionHeight).toEqual(options.perPositionHeight);

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
            show : true,
            material : new ColorMaterialProperty(Color.RED),
            height : 431,
            extrudedHeight : 123,
            granularity : 0.97,
            stRotation : 12,
            fill : true,
            outline : true,
            outlineColor : Color.BLUE,
            perPositionHeight : false,
            closeTop: true,
            closeBottom: false
        });
    });

    it('Creates expected per-material geometry', function() {
        validateGeometryInstance({
            show : true,
            material : new GridMaterialProperty(),
            height : 431,
            extrudedHeight : 123,
            granularity : 0.97,
            stRotation : 12,
            fill : true,
            outline : true,
            outlineColor : Color.BLUE,
            perPositionHeight : false,
            closeTop: false,
            closeBottom: true
        });
    });

    it('Creates expected distance display condition geometry', function() {
        validateGeometryInstance({
            show : true,
            material : new ColorMaterialProperty(Color.RED),
            height : 431,
            extrudedHeight : 123,
            granularity : 0.97,
            stRotation : 12,
            fill : true,
            outline : true,
            outlineColor : Color.BLUE,
            perPositionHeight : false,
            closeTop: true,
            closeBottom: false,
            distanceDisplayCondition : new DistanceDisplayCondition(10.0, 100.0)
        });
    });

    it('Checks that an entity without height and extrudedHeight and with a color material is on terrain', function() {
        var entity = createBasicPolygon();
        entity.polygon.height = undefined;
        entity.polygon.outline = new ConstantProperty(true);

        var updater = new PolygonGeometryUpdater(entity, scene);

        if (groundPrimitiveSupported) {
            expect(updater.onTerrain).toBe(true);
            expect(updater.outlineEnabled).toBe(false);
        } else {
            expect(updater.onTerrain).toBe(false);
            expect(updater.outlineEnabled).toBe(true);
        }
    });

    it('Checks that an entity with height isn\'t on terrain', function() {
        var entity = createBasicPolygon();
        entity.polygon.height = new ConstantProperty(1);

        var updater = new PolygonGeometryUpdater(entity, scene);

        expect(updater.onTerrain).toBe(false);
    });

    it('Checks that an entity with extrudedHeight isn\'t on terrain', function() {
        var entity = createBasicPolygon();
        entity.polygon.height = undefined;
        entity.polygon.extrudedHeight = new ConstantProperty(1);

        var updater = new PolygonGeometryUpdater(entity, scene);

        expect(updater.onTerrain).toBe(false);
    });

    it('Checks that an entity with a non-color material isn\'t on terrain', function() {
        var entity = createBasicPolygon();
        entity.polygon.height = undefined;
        entity.polygon.material = new GridMaterialProperty(Color.BLUE);

        var updater = new PolygonGeometryUpdater(entity, scene);

        expect(updater.onTerrain).toBe(false);
    });

    it('Checks that a polygon with per position heights isn\'t on terrain', function() {
        var entity = createBasicPolygon();
        entity.polygon.height = undefined;
        entity.polygon.perPositionHeight = new ConstantProperty(true);

        var updater = new PolygonGeometryUpdater(entity, scene);

        expect(updater.onTerrain).toBe(false);
    });

    it('Checks that a polygon without per position heights is on terrain', function() {
        var entity = createBasicPolygon();
        entity.polygon.height = undefined;
        entity.polygon.perPositionHeight = new ConstantProperty(false);

        var updater = new PolygonGeometryUpdater(entity, scene);

        if (groundPrimitiveSupported) {
            expect(updater.onTerrain).toBe(true);
        } else {
            expect(updater.onTerrain).toBe(false);
        }
    });

    it('dynamic updater sets properties', function() {
        var polygon = new PolygonGraphics();
        polygon.hierarchy = createDynamicProperty(new PolygonHierarchy(Cartesian3.fromRadiansArray([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ])));
        polygon.show = createDynamicProperty(true);
        polygon.height = createDynamicProperty(3);
        polygon.extrudedHeight = createDynamicProperty(2);
        polygon.outline = createDynamicProperty(true);
        polygon.fill = createDynamicProperty(true);
        polygon.perPositionHeight = createDynamicProperty(false);
        polygon.granularity = createDynamicProperty(2);
        polygon.stRotation = createDynamicProperty(1);
        polygon.closeTop = createDynamicProperty(false);
        polygon.closeBottom = createDynamicProperty(false);

        var entity = new Entity();
        entity.polygon = polygon;

        var updater = new PolygonGeometryUpdater(entity, scene);
        var primitives = new PrimitiveCollection();
        var groundPrimitives = new PrimitiveCollection();
        var dynamicUpdater = updater.createDynamicUpdater(primitives, groundPrimitives);
        expect(dynamicUpdater.isDestroyed()).toBe(false);
        expect(primitives.length).toBe(0);
        expect(groundPrimitives.length).toBe(0);

        dynamicUpdater.update(time);
        expect(primitives.length).toBe(2);
        expect(groundPrimitives.length).toBe(0);

        var options = dynamicUpdater._options;
        expect(options.id).toEqual(entity);
        expect(options.polygonHierarchy).toEqual(polygon.hierarchy.getValue());
        expect(options.height).toEqual(polygon.height.getValue());
        expect(options.extrudedHeight).toEqual(polygon.extrudedHeight.getValue());
        expect(options.perPositionHeight).toEqual(polygon.perPositionHeight.getValue());
        expect(options.granularity).toEqual(polygon.granularity.getValue());
        expect(options.stRotation).toEqual(polygon.stRotation.getValue());
        expect(options.closeTop).toEqual(polygon.closeTop.getValue());
        expect(options.closeBottom).toEqual(polygon.closeBottom.getValue());

        entity.show = false;
        updater._onEntityPropertyChanged(entity, 'show');
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(0);
        expect(groundPrimitives.length).toBe(0);
        entity.show = true;
        updater._onEntityPropertyChanged(entity, 'show');

        //If a dynamic show returns false, the primitive should go away.
        polygon.show.setValue(false);
        updater._onEntityPropertyChanged(entity, 'polygon');
        dynamicUpdater.update(time);
        expect(primitives.length).toBe(0);
        expect(groundPrimitives.length).toBe(0);

        polygon.show.setValue(true);
        updater._onEntityPropertyChanged(entity, 'polygon');
        dynamicUpdater.update(time);
        expect(primitives.length).toBe(2);
        expect(groundPrimitives.length).toBe(0);

        //If a dynamic position returns undefined, the primitive should go away.
        polygon.hierarchy.setValue(undefined);
        updater._onEntityPropertyChanged(entity, 'polygon');
        dynamicUpdater.update(time);
        expect(primitives.length).toBe(0);
        expect(groundPrimitives.length).toBe(0);

        dynamicUpdater.destroy();
        updater.destroy();
    });

    it('dynamic updater on terrain', function() {
        var polygon = new PolygonGraphics();
        polygon.hierarchy = createDynamicProperty(new PolygonHierarchy(Cartesian3.fromRadiansArray([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ])));
        polygon.show = createDynamicProperty(true);
        polygon.outline = createDynamicProperty(true);
        polygon.fill = createDynamicProperty(true);
        polygon.granularity = createDynamicProperty(2);
        polygon.stRotation = createDynamicProperty(1);

        var entity = new Entity();
        entity.polygon = polygon;

        var updater = new PolygonGeometryUpdater(entity, scene);
        var primitives = new PrimitiveCollection();
        var groundPrimitives = new PrimitiveCollection();
        var dynamicUpdater = updater.createDynamicUpdater(primitives, groundPrimitives);
        expect(dynamicUpdater.isDestroyed()).toBe(false);
        expect(primitives.length).toBe(0);
        expect(groundPrimitives.length).toBe(0);

        dynamicUpdater.update(time);

        if (groundPrimitiveSupported) {
            expect(primitives.length).toBe(0);
            expect(groundPrimitives.length).toBe(1);
        } else {
            expect(primitives.length).toBe(2);
            expect(groundPrimitives.length).toBe(0);
        }

        dynamicUpdater.destroy();
        updater.destroy();
    });

    it('geometryChanged event is raised when expected', function() {
        var entity = createBasicPolygon();
        var updater = new PolygonGeometryUpdater(entity, scene);
        var listener = jasmine.createSpy('listener');
        updater.geometryChanged.addEventListener(listener);

        entity.polygon.hierarchy = new ConstantProperty([]);
        updater._onEntityPropertyChanged(entity, 'polygon');
        expect(listener.calls.count()).toEqual(1);

        entity.polygon.height = new ConstantProperty(82);
        updater._onEntityPropertyChanged(entity, 'polygon');
        expect(listener.calls.count()).toEqual(2);

        entity.availability = new TimeIntervalCollection();
        updater._onEntityPropertyChanged(entity, 'availability');
        expect(listener.calls.count()).toEqual(3);

        entity.polygon.hierarchy = undefined;
        updater._onEntityPropertyChanged(entity, 'polygon');
        expect(listener.calls.count()).toEqual(4);

        //Since there's no valid geometry, changing another property should not raise the event.
        entity.polygon.height = undefined;
        updater._onEntityPropertyChanged(entity, 'polygon');

        //Modifying an unrelated property should not have any effect.
        entity.viewFrom = new ConstantProperty(Cartesian3.UNIT_X);
        updater._onEntityPropertyChanged(entity, 'viewFrom');
        expect(listener.calls.count()).toEqual(4);
    });

    it('fill is true sets onTerrain to true', function() {
        var entity = createBasicPolygonWithoutHeight();
        entity.polygon.fill = true;
        var updater = new PolygonGeometryUpdater(entity, scene);
        if (groundPrimitiveSupported) {
            expect(updater.onTerrain).toBe(true);
        } else {
            expect(updater.onTerrain).toBe(false);
        }
    });

    it('fill is false sets onTerrain to false', function() {
        var entity = createBasicPolygonWithoutHeight();
        entity.polygon.fill = false;
        var updater = new PolygonGeometryUpdater(entity, scene);
        expect(updater.onTerrain).toBe(false);
    });

    it('a defined height sets onTerrain to false', function() {
        var entity = createBasicPolygonWithoutHeight();
        entity.polygon.fill = true;
        entity.polygon.height = 0;
        var updater = new PolygonGeometryUpdater(entity, scene);
        expect(updater.onTerrain).toBe(false);
    });

    it('a defined extrudedHeight sets onTerrain to false', function() {
        var entity = createBasicPolygonWithoutHeight();
        entity.polygon.fill = true;
        entity.polygon.extrudedHeight = 12;
        var updater = new PolygonGeometryUpdater(entity, scene);
        expect(updater.onTerrain).toBe(false);
    });

    it('perPositionHeight is true sets onTerrain to false', function() {
        var entity = createBasicPolygonWithoutHeight();
        entity.polygon.fill = true;
        entity.polygon.perPositionHeight = true;
        var updater = new PolygonGeometryUpdater(entity, scene);
        expect(updater.onTerrain).toBe(false);
    });

    it('color material sets onTerrain to true', function() {
        var entity = createBasicPolygonWithoutHeight();
        entity.polygon.fill = true;
        entity.polygon.material = new ColorMaterialProperty(Color.WHITE);
        var updater = new PolygonGeometryUpdater(entity, scene);
        if (groundPrimitiveSupported) {
            expect(updater.onTerrain).toBe(true);
        } else {
            expect(updater.onTerrain).toBe(false);
        }
    });

    it('non-color material sets onTerrain to false', function() {
        var entity = createBasicPolygonWithoutHeight();
        entity.polygon.fill = true;
        entity.polygon.material = new CheckerboardMaterialProperty();
        var updater = new PolygonGeometryUpdater(entity, scene);
        expect(updater.onTerrain).toBe(false);
    });

    var entity = createBasicPolygon();
    entity.polygon.extrudedHeight = createDynamicProperty(2);
    createDynamicGeometryBoundingSphereSpecs(PolygonGeometryUpdater, entity, entity.polygon, function() {
        return scene;
    });

    createGeometryUpdaterSpecs(PolygonGeometryUpdater, 'polygon', createBasicPolygon, function() {
        return scene;
    });
}, 'WebGL');

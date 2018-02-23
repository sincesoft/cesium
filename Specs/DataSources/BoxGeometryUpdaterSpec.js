defineSuite([
    'DataSources/BoxGeometryUpdater',
    'Core/Cartesian3',
    'Core/Color',
    'Core/ColorGeometryInstanceAttribute',
    'Core/DistanceDisplayCondition',
    'Core/DistanceDisplayConditionGeometryInstanceAttribute',
    'Core/JulianDate',
    'Core/ShowGeometryInstanceAttribute',
    'Core/TimeInterval',
    'Core/TimeIntervalCollection',
    'DataSources/BoxGraphics',
    'DataSources/ColorMaterialProperty',
    'DataSources/ConstantPositionProperty',
    'DataSources/ConstantProperty',
    'DataSources/Entity',
    'DataSources/GridMaterialProperty',
    'DataSources/SampledProperty',
    'DataSources/TimeIntervalCollectionProperty',
    'Scene/PrimitiveCollection',
    'Scene/ShadowMode',
    'Specs/createDynamicGeometryBoundingSphereSpecs',
    'Specs/createDynamicProperty',
    'Specs/createGeometryUpdaterSpecs',
    'Specs/createScene'
], function(
    BoxGeometryUpdater,
    Cartesian3,
    Color,
    ColorGeometryInstanceAttribute,
    DistanceDisplayCondition,
    DistanceDisplayConditionGeometryInstanceAttribute,
    JulianDate,
    ShowGeometryInstanceAttribute,
    TimeInterval,
    TimeIntervalCollection,
    BoxGraphics,
    ColorMaterialProperty,
    ConstantPositionProperty,
    ConstantProperty,
    Entity,
    GridMaterialProperty,
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

    function createBasicBox() {
        var box = new BoxGraphics();
        box.dimensions = new ConstantProperty(new Cartesian3(1, 2, 3));
        var entity = new Entity();
        entity.position = new ConstantPositionProperty(Cartesian3.fromDegrees(0, 0, 0));
        entity.box = box;
        return entity;
    }

    it('A time-varying dimensions causes geometry to be dynamic', function() {
        var entity = createBasicBox();
        var updater = new BoxGeometryUpdater(entity, scene);
        entity.box.dimensions = createDynamicProperty();
        updater._onEntityPropertyChanged(entity, 'box');

        expect(updater.isDynamic).toBe(true);
    });

    function validateGeometryInstance(options) {
        var entity = createBasicBox();

        var box = entity.box;
        box.show = new ConstantProperty(options.show);
        box.fill = new ConstantProperty(options.fill);
        box.material = options.material;
        box.outline = new ConstantProperty(options.outline);
        box.outlineColor = new ConstantProperty(options.outlineColor);
        box.dimensions = new ConstantProperty(options.dimensions);
        box.distanceDisplayCondition = options.distanceDisplayCondition;

        var updater = new BoxGeometryUpdater(entity, scene);

        var instance;
        var geometry;
        var attributes;
        if (options.fill) {
            instance = updater.createFillGeometryInstance(time);
            geometry = instance.geometry;
            expect(geometry._maximum).toEqual(Cartesian3.multiplyByScalar(options.dimensions, 0.5, new Cartesian3()));

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
            expect(geometry._max).toEqual(Cartesian3.multiplyByScalar(options.dimensions, 0.5, new Cartesian3()));

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
            fill : true,
            outline : true,
            outlineColor : Color.BLUE,
            dimensions : new Cartesian3(1, 2, 3)
        });
    });

    it('Creates expected per-material geometry', function() {
        validateGeometryInstance({
            show : true,
            material : new GridMaterialProperty(),
            fill : true,
            outline : true,
            outlineColor : Color.BLUE,
            dimensions : new Cartesian3(1, 2, 3)
        });
    });

    it('Creates expected distance display condition geometry', function() {
        validateGeometryInstance({
            show : true,
            material : new ColorMaterialProperty(Color.RED),
            fill : true,
            outline : true,
            outlineColor : Color.BLUE,
            dimensions : new Cartesian3(1, 2, 3),
            distanceDisplayCondition : new DistanceDisplayCondition(10.0, 100.0)
        });
    });

    it('dynamic updater sets properties', function() {
        var entity = new Entity();
        entity.position = new ConstantPositionProperty(Cartesian3.fromDegrees(0, 0, 0));
        var box = new BoxGraphics();
        entity.box = box;

        box.show = createDynamicProperty(true);
        box.dimensions = createDynamicProperty(new Cartesian3(1, 2, 3));
        box.outline = createDynamicProperty(true);
        box.fill = createDynamicProperty(true);

        var updater = new BoxGeometryUpdater(entity, scene);
        var primitives = new PrimitiveCollection();
        var dynamicUpdater = updater.createDynamicUpdater(primitives, new PrimitiveCollection());
        expect(primitives.length).toBe(0);

        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(2);
        expect(dynamicUpdater.isDestroyed()).toBe(false);

        expect(dynamicUpdater._options.id).toBe(entity);
        expect(dynamicUpdater._options.dimensions).toEqual(box.dimensions.getValue());

        entity.show = false;
        updater._onEntityPropertyChanged(entity, 'show');
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(0);
        entity.show = true;
        updater._onEntityPropertyChanged(entity, 'show');

        box.show.setValue(false);
        updater._onEntityPropertyChanged(entity, 'box');
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(0);

        box.show.setValue(true);
        box.fill.setValue(false);
        updater._onEntityPropertyChanged(entity, 'box');
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(1);

        box.fill.setValue(true);
        box.outline.setValue(false);
        updater._onEntityPropertyChanged(entity, 'box');
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(1);

        dynamicUpdater.destroy();
        expect(primitives.length).toBe(0);
        updater.destroy();
    });

    it('dynamic updater does not create primitives when dimensions.getValue() is undefined', function() {
        var entity = new Entity();
        entity.position = new ConstantPositionProperty(Cartesian3.fromDegrees(0, 0, 0));
        var box = new BoxGraphics();
        entity.box = box;

        box.show = createDynamicProperty(true);
        box.dimensions = createDynamicProperty(undefined);
        box.outline = createDynamicProperty(true);
        box.fill = createDynamicProperty(true);

        var updater = new BoxGeometryUpdater(entity, scene);
        var primitives = new PrimitiveCollection();
        var dynamicUpdater = updater.createDynamicUpdater(primitives, new PrimitiveCollection());
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(0);

        box.dimensions.setValue(new Cartesian3(1, 2, 3));
        updater._onEntityPropertyChanged(entity, 'box');
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(2);
        updater.destroy();
    });

    it('geometryChanged event is raised when expected', function() {
        var entity = createBasicBox();
        var updater = new BoxGeometryUpdater(entity, scene);
        var listener = jasmine.createSpy('listener');
        updater.geometryChanged.addEventListener(listener);

        entity.box.dimensions = new ConstantProperty();
        updater._onEntityPropertyChanged(entity, 'box');
        expect(listener.calls.count()).toEqual(1);

        entity.availability = new TimeIntervalCollection();
        updater._onEntityPropertyChanged(entity, 'availability');
        expect(listener.calls.count()).toEqual(2);

        entity.box.dimensions = undefined;
        updater._onEntityPropertyChanged(entity, 'box');
        expect(listener.calls.count()).toEqual(3);

        //Since there's no valid geometry, changing another property should not raise the event.
        entity.box.height = undefined;
        updater._onEntityPropertyChanged(entity, 'box');

        //Modifying an unrelated property should not have any effect.
        entity.viewFrom = new ConstantProperty(Cartesian3.UNIT_X);
        updater._onEntityPropertyChanged(entity, 'viewFrom');
        expect(listener.calls.count()).toEqual(3);
    });

    var entity = createBasicBox();
    entity.box.dimensions = createDynamicProperty(new Cartesian3(1, 2, 3));
    createDynamicGeometryBoundingSphereSpecs(BoxGeometryUpdater, entity, entity.box, function() {
        return scene;
    });

    createGeometryUpdaterSpecs(BoxGeometryUpdater, 'box', createBasicBox, function() {
        return scene;
    });
}, 'WebGL');

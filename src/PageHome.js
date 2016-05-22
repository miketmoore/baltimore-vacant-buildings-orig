var React = require('react');
var Layout = require('./Layout');
var MapView = require('./MapView');
var Select = require('./Select');
var Button = require('./Button');
var BarGraphSmall = require('./BarGraphSmall');
import ReactDataGrid from 'react-data-grid/addons';

module.exports = React.createClass({
    getDefaultProps () {
        return {
            papers: [new paper.PaperScope(), new paper.PaperScope()],
            months: ['01','02','03','04','05','06','07','08','09','10','11','12'],
            gridColumns: [
                {"key":"buildingaddress","name":"Address","resizable":true},
                {"key":"noticedate","name":"Notice Date","resizable":true},
                {"key":"neighborhood","name":"Neighborhood","resizable":true},
                {"key":"policedistrict","name":"Police District","resizable":true},
                {"key":"councildistrict","name":"Council District","resizable":true}
            ]
        };
    },
    getInitialState() {
        return {
            years: [],
            year: '',
            month: '01',
            councildistrict: '',
            policedistrict: '',
            neighborhood: ''
        };
    },
    _yearSelectChangeHandler (val) {
        this.setState({
            year: val
        });
    },
    _monthSelectChangeHandler (val) {
        this.setState({
            month: val
        });
    },
    _neighborhoodSelectChangeHandler (val) {
        this.setState({
            neighborhood: val
        });
    },
    _councilGraphClickHandler (data) {
        this.setState({
            councildistrict: data.label
        });
    },
    _policeGraphClickHandler (data) {
        var label = data.label;
        var val = this.props.model.policeDistrictLookup.get('toValue').get(label);
        this.setState({
            policedistrict: val
        });
    },
    _clearMonthHandler () {
        this.setState({
            month: ''
        });
    },
    _clearCouncilHandler () {
        this.setState({
            councildistrict: ''
        });
    },
    _clearPoliceHandler () {
        this.setState({
            policedistrict: ''
        });
    },
    _clearNeighborhoodHandler () {
        this.setState({
            neighborhood: ''
        })
    },
    // Update state with actual data
    _init () {
        var model = this.props.model;
        var byYear = model.index.get('yyyy');
        var years = Array.from(byYear.keys()).sort();
        var year = years[years.length-1];

        var filters = { year: year };
        if (this.state.month) filters.month = this.state.month;
        var entries = this.props.model.filter(filters);

        this.setState({
            years: years,
            year: year
        });
    },
    componentWillReceiveProps (props) {
        this._init();
    },
    // called before render
    // setting state here will not trigger re-rendering
    componentWillMount () {
        var map = this.props.model.index.get('yyyy');
        if (map.size) {
            this._init();
        }
    },
    _getBarGraphData (key) {
        var model = this.props.model;
        if (!model.rows.length) return [];
        // get entries filtered by current year and month (these are always set)
        var filters = {
            year: this.state.year
        };
        if (this.state.month) filters.month = this.state.month;
        if (this.state.neighborhood) filters.neighborhood = this.state.neighborhood;
        if (this.state.councildistrict) filters.councildistrict = this.state.councildistrict;
        if (this.state.policedistrict) filters.policedistrict = this.state.policedistrict;
        var entriesByDate = model.filter(filters);
        // Get full, distinct list
        var distinct = Array.from(model.index.get(key).keys());
        // Map distinct item to total entries associated to it
        var map = new Map();
        distinct.forEach(k => map.set(k, 0));
        entriesByDate.forEach(function (entry) {
            map.set(entry[key], map.get(entry[key]) + 1);
        });
        var data = [];
        map.forEach(function (mapVal, mapKey) {
            var obj = {
                size: mapVal
            };
            if (key == 'policedistrict') {
                obj.label = this.props.model.policeDistrictLookup.get('toDisplay').get(mapKey);
            } else {
                obj.label = mapKey
            }
            data.push(obj);
        }, this);
        return data;
    },
    _getEntries () {
        var filters = { year: this.state.year };
        if (this.state.month) filters.month = this.state.month;
        if (this.state.councildistrict) filters.councildistrict = this.state.councildistrict;
        if (this.state.policedistrict) filters.policedistrict = this.state.policedistrict;
        if (this.state.neighborhood) filters.neighborhood = this.state.neighborhood;
        return this.props.model.filter(filters) || [];
    },
    _getNeighborhoods () {
        var index = this.props.model.index;
        if (index.has('neighborhood')) {
            return Array.from(index.get('neighborhood').keys()).sort();
        }
        return [];
    },
    _sortBarGraphData (key) {
        var sorters = {
            councildistrict: function (a,b) {
                a = parseInt(a.label);
                b = parseInt(b.label);
                if (a < b) return -1;
                if (a > b ) return 1;
                return 0;
            }
        };
        return sorters[key];
    },
    _getMapData (entries) {
        var data = [];
        var entry;
        for ( var i = 0; i < entries.length; i++ ) {
            entry = entries[i];
            data.push({
                key: entry[':id'],
                address: entry.buildingaddress,
                latitude: entry.location[1],
                longitude: entry.location[2]
            });
        }
        return data;
    },
    render () {
        var neighborhoods = this._getNeighborhoods();
        var entries = this._getEntries.call(this);
        function gridRowGetter (i) {
            var row = entries[i];
            return {
                "buildingaddress":row['buildingaddress'],
                "noticedate":row['noticedate'],
                "neighborhood":row["neighborhood"],
                'policedistrict':row['policedistrict'],
                'councildistrict':row['councildistrict']
            };
        };

        // Map the label (N, NW, etc) to the display value (NORTHERN, NORTHWESTERN, etc)
        var selectedLabelPoliceDistrict = this.props.model.policeDistrictLookup.get('toDisplay').get(this.state.policedistrict);

        var barColorSchemes = {
            night: {
                bgroundcolor: '#4EC0CC',
                barcolor: "#33627A",
                barcolorhover: "#719BB0",
                barcolorselected: "#BEE7FA",
                bordercolor: '#7790D9',
                fontcolora: "#FFFFFF",
                fontcolorb: "#33627A"
            },
            baltimoreAbandonedRowHouses: {
                bgroundcolor: '#c5b7a9', // suva gray
                barcolor: '#8c8886', // ash gray
                barcolorhover: '#af4e5b', // light steel blue
                barcolorselected: '#b2c8e3', // hippie pink brown
                fontcolora: '#433030',
                fontcolorb: '#433030'
            }
        };
        var barSharedProps = barColorSchemes.night;
        var mapData = this._getMapData(entries);
        return (
            <Layout>
                <div className="row">
                    <div className="col-md-4">
                        <p>Displaying {entries.length} Vacancies</p>
                        <MapView
                            width="350px"
                            height="350px"
                            data={mapData} />
                    </div>
                    <div className="col-md-8">
                        <div className="row">
                            <div className="col-md-2">
                                <h4>Year</h4>
                                <Select
                                    currentVal={this.state.year}
                                    changeHandler={this._yearSelectChangeHandler}
                                    values={this.state.years}
                                    liveSearch={true}
                                />
                            </div>
                            <div className="col-md-3">
                                <h4>Month</h4>
                                <Select
                                    currentVal={this.state.month}
                                    changeHandler={this._monthSelectChangeHandler}
                                    values={this.props.months}
                                />
                                <Button
                                    disabled={this.state.month == ''}
                                    clickHandler={this._clearMonthHandler}
                                    label="Clear"
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-8">
                                <h4>Neighborhoods</h4>
                                <Select
                                    title="Select One"
                                    currentVal={this.state.neighborhood}
                                    changeHandler={this._neighborhoodSelectChangeHandler}
                                    values={neighborhoods}
                                    liveSearch={true}
                                />
                                <Button
                                    disabled={this.state.neighborhood == ''}
                                    clickHandler={this._clearNeighborhoodHandler}
                                    label="Clear"
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-4">
                                <h4>Council Districts</h4>
                                <p><small>Click a bar to filter data.</small> <Button
                                    disabled={this.state.councildistrict == ''}
                                    clickHandler={this._clearCouncilHandler}
                                    label="Clear"
                                    size="xs"
                                /></p>

                                <BarGraphSmall
                                    data={this._getBarGraphData('councildistrict')}
                                    selectedLabel={this.state.councildistrict}
                                    clickHandler={this._councilGraphClickHandler}
                                    paper={this.props.papers[0]}
                                    sort={this._sortBarGraphData('councildistrict')}
                                    {...barSharedProps}
                                />
                            </div>
                            <div className="col-md-4">
                                <h4>Police Districts</h4>
                                <p><small>Click a bar to filter data.</small> <Button
                                    disabled={this.state.policedistrict == ''}
                                    clickHandler={this._clearPoliceHandler}
                                    label="Clear"
                                    size="xs"
                                /></p>

                                <BarGraphSmall
                                    data={this._getBarGraphData('policedistrict')}
                                    selectedLabel={selectedLabelPoliceDistrict}
                                    clickHandler={this._policeGraphClickHandler}
                                    paper={this.props.papers[1]}
                                    {...barSharedProps}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-12">
                        <ReactDataGrid
                            columns={this.props.gridColumns}
                            rowGetter={gridRowGetter}
                            rowsCount={entries.length}
                            minHeight={500} />
                    </div>
                </div>
            </Layout>
        )
    }
})

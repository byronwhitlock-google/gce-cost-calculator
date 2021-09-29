import '@fontsource/roboto';
import React from 'react';

class Geometry extends React.Component {

    render () {
        return (        
            <table key="mytables">
            <thead>
                <tr>
                    <th></th>
                    <th colspan="4">Geometry, Utilization (Actuals &amp; Targets)</th>
                    <th colspan="3">On-Demand, CUD, &amp; Term for "Blended" costs</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Desription</td>
                    <td>vCPU</td>
                    <td>Memory</td>
                    <td>PD-BOOT</td>
                    <td>Local SSD</td>
                    <td>On-demand Period</td>
                    <td>CUD Period</td>
                    <td>Term</td>
                </tr>
                <tr>
                    <td></td>
                </tr>
            </tbody>
        </table>
        )
    }
}

export default Geometry;

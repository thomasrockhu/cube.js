import moment from 'moment-timezone';
import { BaseFilter, BaseQuery, UserError } from '@cubejs-backend/schema-compiler';

const GRANULARITY_TO_INTERVAL = {
  day: 'day',
  week: 'week',
  hour: 'hour',
  minute: 'minute',
  second: 'second',
  month: 'month',
  year: 'year'
};

class CubeStoreFilter extends BaseFilter {
  likeIgnoreCase(column: any, not: any, param: any) {
    return `${column}${not ? ' NOT' : ''} LIKE CONCAT('%', ${this.allocateParam(param)}, '%')`;
  }
}

export class CubeStoreQuery extends BaseQuery {
  public newFilter(filter: any) {
    return new CubeStoreFilter(this, filter);
  }

  public convertTz(field: any) {
    return `CONVERT_TZ(${field}, '${moment().tz(this.timezone).format('Z')}')`;
  }

  public timeStampParam() {
    return `to_timestamp(?)`;
  }

  public timeStampCast(value: any) {
    return `CAST(${value} as TIMESTAMP)`; // TODO
  }

  public inDbTimeZone(date: any) {
    return this.inIntegrationTimeZone(date).clone().utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS);
  }

  public dateTimeCast(value: any) {
    return `to_timestamp(${value})`;
  }

  public subtractInterval(date: any, interval: any) {
    return `DATE_SUB(${date}, INTERVAL ${interval})`;
  }

  public addInterval(date: any, interval: any) {
    return `DATE_ADD(${date}, INTERVAL ${interval})`;
  }

  public timeGroupedColumn(granularity: any, dimension: any) {
    return `date_trunc('${GRANULARITY_TO_INTERVAL[granularity]}', ${dimension})`;
  }

  public escapeColumnName(name: any) {
    return `\`${name}\``;
  }

  public seriesSql(timeDimension: any) {
    const values = timeDimension.timeSeries().map(
      ([from, to]) => `select to_timestamp('${from}') date_from, to_timestamp('${to}') date_to`
    ).join(' UNION ALL ');
    return values;
  }

  public concatStringsSql(strings: any) {
    return `CONCAT(${strings.join(', ')})`;
  }

  public unixTimestampSql() {
    return `UNIX_TIMESTAMP()`;
  }

  public wrapSegmentForDimensionSelect(sql: any) {
    return `IF(${sql}, 1, 0)`;
  }

  public preAggregationTableName(cube: any, preAggregationName: any, skipSchema: any) {
    const name = super.preAggregationTableName(cube, preAggregationName, skipSchema);
    if (name.length > 64) {
      throw new UserError(`MySQL can not work with table names that longer than 64 symbols. Consider using the 'sqlAlias' attribute in your cube and in your pre-aggregation definition for ${name}.`);
    }
    return name;
  }

  public hllMerge(sql: any) {
    return `cardinality(merge(${sql}))`;
  }

  public countDistinctApprox(sql: any) {
    // TODO: We should throw an error, but this gets called even when only `hllMerge` result is used.
    return `approx_distinct_is_unsupported_in_cubestore(${sql}))`;
  }
}

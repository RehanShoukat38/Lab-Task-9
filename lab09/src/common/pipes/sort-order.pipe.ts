import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export type SortOrder = 'asc' | 'desc';

@Injectable()
export class SortOrderPipe implements PipeTransform<string | undefined, SortOrder> {
  transform(value: string | undefined): SortOrder {
    if (value === undefined || value === null || value === '') {
      return 'asc';
    }

    const normalized = String(value).toLowerCase();
    if (normalized === 'asc' || normalized === 'desc') {
      return normalized;
    }

    throw new BadRequestException('order must be asc or desc');
  }
}

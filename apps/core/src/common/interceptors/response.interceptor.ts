import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { Observable } from 'rxjs'
import { Injectable } from '@nestjs/common'
import { map } from 'rxjs/operators'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map(data => ({
        code: 200,
        message: '操作成功',
        data: data ?? null
      }))
    )
  }
}
